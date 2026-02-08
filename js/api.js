import {
    db, auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged, GoogleAuthProvider,
    collection, doc, setDoc, addDoc, getDocs, updateDoc, deleteDoc, query, orderBy, where, getDoc, writeBatch, arrayUnion, arrayRemove, collectionGroup,
    reauthenticateWithPopup
} from './firebase-config.js';

import { CONFIG } from './config.js?v=1.3';

export const DEFAULTS = {
    categories: [
        { id: 'cat_001', name: '外食', icon: 'restaurant', type: '支出', order: 1 },
        { id: 'cat_002', name: '交通', icon: 'directions_bus', type: '支出', order: 2 },
        { id: 'cat_003', name: '日常', icon: 'home', type: '支出', order: 3 },
        { id: 'cat_004', name: '繳費', icon: 'barcode_scanner', type: '支出', order: 4 },
        { id: 'cat_005', name: '學習', icon: 'school', type: '支出', order: 5 },
        { id: 'cat_006', name: '娛樂', icon: 'confirmation_number', type: '支出', order: 6 },
        { id: 'cat_007', name: '購物', icon: 'shopping_cart', type: '支出', order: 7 },
        { id: 'cat_008', name: '其他', icon: 'add_card', type: '支出', order: 8 },
        { id: 'cat_009', name: '獎學金', icon: 'payments', type: '收入', order: 9 },
        { id: 'cat_010', name: '其他', icon: 'add_card', type: '收入', order: 10 }
    ],
    paymentMethods: [
        { id: 'pm_001', name: '刷卡', icon: 'credit_card', order: 1 },
        { id: 'pm_002', name: '現金', icon: 'payments', order: 2 },
        { id: 'pm_003', name: '電支', icon: 'qr_code', order: 3 },
        { id: 'pm_004', name: '轉帳', icon: 'currency_exchange', order: 4 }
    ],
    friends: [],
    config: { user_name: '', fx_rate: 0.21 }
};

// ... (existing helper)



// Helper: Get Current User or throw
const getCurrentUser = () => {
    const user = auth.currentUser;
    if (!user) return null;
    return user;
};

export const API = {
    // Auth wrappers
    async login() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Login Failed", error);
            throw error;
        }
    },

    async reauthenticate() {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error("No user logged in");
            const result = await reauthenticateWithPopup(user, googleProvider);
            return result.user;
        } catch (error) {
            console.error("Re-auth Failed", error);
            throw error;
        }
    },

    async logout() {
        await signOut(auth);
    },

    onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, callback);
    },

    async requestIncrementalScope() {
        try {
            const provider = new GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/spreadsheets');
            provider.addScope('https://www.googleapis.com/auth/drive.file');

            // Re-authenticate with extra scope
            const result = await signInWithPopup(auth, provider);
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;

            if (token) {
                sessionStorage.setItem('google_access_token_v4', token);
                sessionStorage.setItem('google_token_expiry', Date.now() + 3500 * 1000); // Usually 1 hour
                return token;
            }
            return null;
        } catch (error) {
            console.error("Scope Request Failed", error);
            throw error;
        }
    },

    getGoogleToken() {
        const token = sessionStorage.getItem('google_access_token_v4');
        const expiry = sessionStorage.getItem('google_token_expiry');
        if (token && expiry && Date.now() < parseInt(expiry)) {
            return token;
        }
        return null;
    },

    invalidateGoogleToken() {
        sessionStorage.removeItem('google_access_token_v4');
        sessionStorage.removeItem('google_token_expiry');
    },

    // Data Access
    async fetchInitialData(options = {}) {
        const user = getCurrentUser();
        // If no user, or in Guest Mode (check app logic), return defaults or handle locally
        // But here we rely on Auth. If not logged in, return empty or defaults.
        if (!user) {
            // Check if Guest? Typically caller should know.
            // Return defaults for guest to start with
            return {
                categories: [],
                friends: [],
                transactions: [],
                projects: [],
                stats: {},
                config: { user_name: 'Guest', fx_rate: DEFAULTS.config.fx_rate }
            };
        }

        const uid = user.uid;

        try {
            // 1. Fetch Config & Metadata (Stored in user's root document or subcollection?)
            // Plan: users/{uid} stores config, categories, paymentMethods as fields or subcollections.
            // Let's store compact metadata in the user doc itself for fewer reads.
            // users/{uid} => { config: {...}, categories: [...], paymentMethods: [...] }

            // 2. Fetch Transactions (Subcollection)
            // users/{uid}/transactions

            const userDocRef = doc(db, 'users', uid);
            // Initialize User Doc if not exists (First login)
            // NOTE: We do a lazy init here.

            // Parallel Fetch
            const [userSnapshot, txSnapshot] = await Promise.all([
                getDoc(userDocRef),
                getDocs(query(collection(db, 'users', uid, 'transactions'), orderBy('spendDate', 'desc')))
            ]);

            let userData = userSnapshot.exists() ? userSnapshot.data() : null;

            // If new user, init defaults
            if (!userData) {
                // Use Google Display Name as default, fallback to DEFAULTS, fallback to 'User'
                const initialUserName = user.displayName || DEFAULTS.config.user_name || 'User';

                userData = {
                    config: { user_name: initialUserName, fx_rate: DEFAULTS.config.fx_rate },
                    categories: DEFAULTS.categories,
                    paymentMethods: DEFAULTS.paymentMethods,
                    friends: DEFAULTS.friends,
                    projects: []
                };
                await setDoc(userDocRef, userData);
            }

            const transactions = txSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                categories: userData.categories || DEFAULTS.categories,
                paymentMethods: userData.paymentMethods || DEFAULTS.paymentMethods,
                friends: userData.friends || [],
                projects: userData.projects || [],
                config: userData.config || {},
                transactions: transactions,
                stats: {} // Calc on frontend now
            };

        } catch (error) {
            console.error("Firestore Error:", error);
            throw error;
        }
    },

    async saveTransaction(payload, tokenOrUid = '') {
        // payload might be a transaction OR a config update
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");

        const uid = user.uid;
        const userRef = doc(db, 'users', uid);

        // Action routing based on 'action' field (Legacy compat) or just check payload structure
        // The app currently sends { action: 'updateConfig', ... } or { ...transaction }

        if (payload.action === 'updateConfig') {
            await updateDoc(userRef, {
                'config.user_name': payload.user_name,
                'config.fx_rate': payload.fx_rate,
                'config.auto_backup': payload.auto_backup ?? false
            });
            return true;
        }

        if (payload.action === 'updateProject') {
            // Projects are stored in an array in userDoc? Or subcollection?
            // User doc is better for small lists.
            const userSnap = await getDoc(userRef);
            let projects = userSnap.data().projects || [];

            if (payload.id) {
                // Edit
                const idx = projects.findIndex(p => p.id === payload.id);
                if (idx !== -1) {
                    // Sanitize payload to remove 'action' and undefined values
                    const { action, ...cleanPayload } = payload;
                    // Merge existing project with clean payload
                    // Filter out undefined from result to be safe
                    const merged = { ...projects[idx], ...cleanPayload };

                    // Firestore rejects undefined, so we must ensure no field is undefined
                    Object.keys(merged).forEach(key => merged[key] === undefined && delete merged[key]);

                    projects[idx] = merged;
                }
            } else {
                // Create
                projects.push({
                    id: 'proj_' + Date.now(),
                    name: payload.name,
                    startDate: payload.startDate,
                    endDate: payload.endDate,
                    status: 'Active' // Default
                });
            }
            await updateDoc(userRef, { projects });
            return true;
        }

        if (payload.action === 'delete') {
            // Delete Transaction
            // We need ID. The gas app used 'row'. We must use 'id'.
            // If payload has no ID, we can't delete from Firestore reliably unless we passed it.
            // modify app.js to pass ID.
            if (!payload.id) throw new Error("Missing ID for deletion");
            await deleteDoc(doc(db, 'users', uid, 'transactions', payload.id));
            return true;
        }

        // Standard Transaction Save (Add or Edit)
        // If edit, payload should have ID.
        // We clean the payload of UI-only fields
        const { action, row, token, ...dataToSave } = payload;

        if (action === 'edit' && payload.id) {
            await setDoc(doc(db, 'users', uid, 'transactions', payload.id), dataToSave, { merge: true });
        } else {
            // New
            // For 'add', generate new doc.
            // If payload has an ID (client generated), use it? Or let Firestore gen?
            // App generates 'tx_{timestamp}'. We can use that as Doc ID.
            const newRef = payload.id ? doc(db, 'users', uid, 'transactions', payload.id) : collection(db, 'users', uid, 'transactions');
            if (payload.id) {
                await setDoc(newRef, dataToSave);
            } else {
                await addDoc(newRef, dataToSave);
            }
        }
        return true;
    },

    // Save full user data (for Settings page: categories, payments, etc.)
    async updateUserData(data) {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");

        const userRef = doc(db, 'users', user.uid);
        // We only update top-level fields: categories, paymentMethods
        const updates = {};
        if (data.categories) updates.categories = data.categories;
        if (data.paymentMethods) updates.paymentMethods = data.paymentMethods;
        if (data.friends) updates.friends = data.friends;

        await updateDoc(userRef, updates);
        return true;
    },

    // Sharing Features
    // --- Shared Links System ---

    async getSharedLinks() {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");
        const snapshot = await getDocs(collection(db, 'users', user.uid, 'shared_links'));
        return snapshot.docs.map(doc => doc.data());
    },

    async createSharedLink(config) {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");

        // Generate Link ID
        const linkId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const linkData = {
            id: linkId,
            createdAt: new Date().toISOString(),
            ...config
        };

        const batch = writeBatch(db);

        // 1. Create Link Doc
        const linkRef = doc(db, 'users', user.uid, 'shared_links', linkId);
        batch.set(linkRef, linkData);

        // 2. Update User's activeSharedIds
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
            activeSharedIds: arrayUnion(linkId)
        });

        await batch.commit();
        return linkId;
    },

    async deleteSharedLink(linkId) {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");

        const batch = writeBatch(db);

        // 1. Delete Link Doc
        const linkRef = doc(db, 'users', user.uid, 'shared_links', linkId);
        batch.delete(linkRef);

        // 2. Remove from activeSharedIds
        const userRef = doc(db, 'users', user.uid);
        batch.update(userRef, {
            activeSharedIds: arrayRemove(linkId)
        });

        await batch.commit();
    },

    async updateSharedLink(linkId, config) {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");
        const linkRef = doc(db, 'users', user.uid, 'shared_links', linkId);
        await updateDoc(linkRef, config);
    },

    // Updated Fetch for Viewer Mode
    async fetchSharedData(linkId, targetUid = null) {
        try {
            let uid = targetUid;
            let linkConfig = null;

            if (uid) {
                // FAST PATH: Direct Access via UID (No Collection Group Index needed)
                const linkSnap = await getDoc(doc(db, 'users', uid, 'shared_links', linkId));
                if (!linkSnap.exists()) throw new Error("Link configuration not found.");
                linkConfig = linkSnap.data();
            } else {
                // SLOW PATH: Legacy links without UID (Requires Index)
                const linkQuery = query(collectionGroup(db, 'shared_links'), where('id', '==', linkId));
                const linkQuerySnapshot = await getDocs(linkQuery);

                if (linkQuerySnapshot.empty) {
                    throw new Error("Shared link is invalid or expired.");
                }

                const linkSnap = linkQuerySnapshot.docs[0];
                linkConfig = linkSnap.data();
                uid = linkSnap.ref.parent.parent.id;
            }

            const userDocRef = doc(db, 'users', uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) throw new Error("Owner user not found.");

            return this._fetchDataForUser(userDoc, linkConfig);

        } catch (error) {
            console.error("Fetch Shared Data Error", error);
            throw error;
        }
    },

    async _fetchDataForUser(userDoc, linkConfig) {
        const uid = userDoc.id;
        const userData = userDoc.data();

        // 3. Fetch Transactions
        let qTx = query(collection(db, 'users', uid, 'transactions'), orderBy('spendDate', 'desc'));
        const txSnapshot = await getDocs(qTx);
        let transactions = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 4. Apply Link Filters
        // Date Range
        if (linkConfig.scope === 'range' && linkConfig.scopeValue) {
            const { start, end } = linkConfig.scopeValue;
            if (start) transactions = transactions.filter(t => t.spendDate >= start);
            if (end) transactions = transactions.filter(t => t.spendDate <= end);
        }
        // Project Scope
        if (linkConfig.scope === 'project' && linkConfig.scopeValue) {
            transactions = transactions.filter(t => t.projectId === linkConfig.scopeValue);
        }
        // Exclude Project Expenses (if not project scope)
        if (linkConfig.scope !== 'project' && linkConfig.excludeProjectExpenses) {
            transactions = transactions.filter(t => !t.projectId);
            userData.projects = []; // Don't load projects if expenses are excluded
        }

        // Privacy: Mask Friends
        if (linkConfig.hideFriendNames) {
            // Mask in transactions
            transactions.forEach(t => {
                if (t.payer && t.payer !== 'Me' && t.payer !== '我') t.payer = "友";
                if (t.friendName) t.friendName = "友";
                if (t.beneficiaries) {
                    t.beneficiaries = t.beneficiaries.map(b => (b === 'Me' || b === '我') ? b : "友");
                }
            });
            // Don't return real friend list
            userData.friends = [];
        }

        // Privacy: Mask Projects
        if (linkConfig.hideProjectNames) {
            // transactions.forEach(t => { if(t.projectId) t.projectName = "專案"; }); // We don't have projectName in tx usually, just ID.
            // But we filter the projects list passed to config.
            // Actually, we fetch projects?
            // "Viewer Mode" expects 'projects' list.
            if (linkConfig.scope === 'project') {
                // Return only that project, maybe masked? No, if dedicated link, name should probably show?
                // User requirement: "隱藏專案名稱，僅顯示代號"
                userData.projects = userData.projects?.filter(p => p.id === linkConfig.scopeValue).map((p, i) => ({ ...p, name: "專案 " + (i + 1) }));
            } else {
                userData.projects = userData.projects?.map((p, i) => ({ ...p, name: "專案 " + (i + 1) }));
            }
        } else {
            // Normal Project Filtering
            if (linkConfig.scope === 'project') {
                userData.projects = userData.projects?.filter(p => p.id === linkConfig.scopeValue);
            }
        }

        // Override User Name with Link Name
        if (linkConfig.name) {
            userData.user_name = linkConfig.name;
        }

        return {
            config: userData, // Includes fx_rate
            transactions,
            friends: userData.friends || [], // Might be empty if masked
            projects: userData.projects || [],
            paymentMethods: userData.paymentMethods || [],
            categories: userData.categories || [],
            linkConfig: linkConfig // Pass full config for UI usage
        };
    },

    async clearAccountData() {
        // ... (existing)
    },

    async importData(data, onProgress) {
        const user = auth.currentUser;
        if (!user) throw new Error("Not logged in");

        const uid = user.uid;
        const userRef = doc(db, 'users', uid);

        let count = 0;

        try {
            // 1. Update User Metadata (Config, Categories, etc.)
            const updates = {};
            if (data.categories) updates.categories = data.categories;
            if (data.paymentMethods) updates.paymentMethods = data.paymentMethods;
            if (data.friends) updates.friends = data.friends;
            if (data.projects) updates.projects = data.projects;
            if (data.config) updates.config = data.config;

            if (Object.keys(updates).length > 0) {
                if (onProgress) onProgress("正在更新設定與類別...");
                await setDoc(userRef, updates, { merge: true });
            }

            // 2. Import Transactions (Batch Write)
            if (data.transactions && data.transactions.length > 0) {
                if (onProgress) onProgress(`準備匯入 ${data.transactions.length} 筆交易...`);

                // Chunk into batches of 500
                const chunkSize = 450; // Safer limit
                const chunks = [];
                for (let i = 0; i < data.transactions.length; i += chunkSize) {
                    chunks.push(data.transactions.slice(i, i + chunkSize));
                }

                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const batch = writeBatch(db);

                    if (onProgress) onProgress(`正在寫入批次 ${i + 1}/${chunks.length}...`);

                    chunk.forEach(tx => {
                        // Ensure we use the ID from JSON or generate one?
                        // If JSON has ID, use it (Restore).
                        // If checking for duplicates? "Restore" usually implies we trust the backup ID.
                        // If ID exists, setDoc matches overwrite.
                        const txId = tx.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
                        const txRef = doc(db, 'users', uid, 'transactions', txId);

                        // Clean data
                        const { id, ...txData } = tx;
                        batch.set(txRef, txData);
                    });

                    await batch.commit();
                    count += chunk.length;
                }
            }

            return { success: true, count };
        } catch (error) {
            console.error("Import Data Error", error);
            throw error;
        }
    },

    async deleteFullAccount() {
        const user = getCurrentUser();
        if (!user) throw new Error("No user logged in");

        const uid = user.uid;
        const batch = writeBatch(db);

        // 1. Delete Subcollections
        const collections = ['transactions', 'projects', 'categories', 'paymentMethods', 'friends'];

        // Note: Client SDK cannot delete collections directly. 
        // We must fetch docs and delete them.
        for (const colName of collections) {
            const colRef = collection(db, 'users', uid, colName);
            const snapshot = await getDocs(colRef);
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
        }

        // 2. Delete User Doc
        const userRef = doc(db, 'users', uid);
        batch.delete(userRef);

        await batch.commit();

        // 3. Delete Auth User
        // This requires recent login. If it fails, we catch it in UI and ask for re-login.
        await user.delete();
    }
};
