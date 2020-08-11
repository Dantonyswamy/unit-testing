const assert = require('assert');
const firebase = require('@firebase/testing');

const MY_PROJECT_ID = "rte-covid19-bllsom";
const myId = "user_xyz";
const theirId = "user_abc";
const myAuth = {uid:myId, email:"xyz@test.com"}

function getFirestore(auth){
    return firebase.initializeTestApp({projectId:MY_PROJECT_ID, auth:myAuth}).firestore();
}
function getAdminFirestore(){
    return firebase.initializeAdminApp({projectId:MY_PROJECT_ID}).firestore();
}
beforeEach(async() => {
    await firebase.clearFirestoreData({projectId:MY_PROJECT_ID})
})

describe('Our social app',()=>{
    it('Understands basic addition',() => {
        assert.equal(2+2, 4);
    })

    it('Can read items in the read-only collection',async () => {
        const db = getFirestore(null);
        const testDoc = db.collection('readonly').doc('testDoc');
        await firebase.assertSucceeds(testDoc.get());
    })
    it("Can't write items in the read-only collection",async () => {
        const db = getFirestore(null);
        const testDoc = db.collection('readonly').doc('testDoc');
        await firebase.assertFails(testDoc.set({foo:"bar"}));
    })
    it("Can write to users document with same ID as our user",async () => {        
        const db = getFirestore(myAuth);
        const testDoc = db.collection('users').doc(myId);
        await firebase.assertSucceeds(testDoc.set({foo:"bar"}));
    })
    it("Can't write to users document with different ID as our user",async () => {
        const db = getFirestore(myAuth);
        const testDoc = db.collection('users').doc(theirId);
        await firebase.assertFails(testDoc.set({foo:"bar"}));
    })
    it("Can read posts marked public", async () =>{
        const db = getFirestore(null);
        const testQuery = db.collection("posts").where("visibility","==", "public");   
        await firebase.assertSucceeds(testQuery.get());
    })
    it("Can read personal posts by signed-in user", async () =>{
        const db = getFirestore(myAuth);
        const testQuery = db.collection("posts").where("authorId","==", myId);   
        await firebase.assertSucceeds(testQuery.get());
    })
    it("Can't query all posts by signed-in user", async () =>{
        const db = getFirestore(myAuth);
        const testQuery = db.collection("posts");   
        await firebase.assertFails(testQuery.get());
    })
    it("Can read a single document marked as public by signed-in user", async () =>{
        const admin = getAdminFirestore();
        const postId = "public_post";
        const setupDoc = admin.collection("posts").doc(postId);
        await setupDoc.set({authorId:theirId, visibility:"public"})

        const db = getFirestore(null);
        const testRead = db.collection("posts").doc(postId);
        await firebase.assertSucceeds(testRead.get())        
    })
    it("Can read a single document marked as private that belongs to the signed-in user", async () =>{
        const admin = getAdminFirestore();
        const postId = "private_post";
        const setupDoc = admin.collection("posts").doc(postId);
        await setupDoc.set({authorId:myId, visibility:"private"})

        const db = getFirestore(myAuth);
        const testRead = db.collection("posts").doc(postId);
        await firebase.assertSucceeds(testRead.get())        
    })
    it("Can't read a single document marked as private that does not belong to signed-in user", async () =>{
        const admin = getAdminFirestore();
        const postId = "private_post";
        const setupDoc = admin.collection("posts").doc(postId);
        await setupDoc.set({authorId:theirId, visibility:"private"})

        const db = getFirestore(myAuth);
        const testRead = db.collection("posts").doc(postId);
        await firebase.assertFails(testRead.get())        
    })
})

