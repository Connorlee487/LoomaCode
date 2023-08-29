async function main() {
    const MongoClient = require('mongodb').MongoClient;
    console.log('before set URL');
    url = "mongodb://localhost:27017/";
    console.log('connecting');
    
    const db = await MongoClient.connect(url), dbo = db.db("looma");
    console.log('connected');
};

main();