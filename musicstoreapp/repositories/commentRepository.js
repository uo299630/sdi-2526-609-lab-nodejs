module.exports = {
    dbClient: null,
    app: null,
    database: "musicStore",
    collectionName: "comments",

    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },

    addComment: async function (comment) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const commentsCollection = database.collection(this.collectionName);
            const result = await commentsCollection.insertOne(comment);
            return result.insertedId;
        } catch (error) {
            throw error;
        }
    },

    getComments: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const commentsCollection = database.collection(this.collectionName);
            const comments = await commentsCollection.find(filter, options).toArray();
            return comments;
        } catch (error) {
            throw error;
        }
    },
    deleteComments: async function (filter, options){
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const commentsCollection = database.collection(this.collectionName);
            const result = await commentsCollection.deleteMany(filter, options);
            return result;
        } catch (error) {
            throw error;
        }
    }
};

