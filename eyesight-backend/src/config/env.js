require('dotenv').config();

module.exports = {
    app: {
        port:    process.env.PORT     || 3333,
        nodeEnv: process.env.NODE_ENV || 'development',
    },

    jwt: {
        secret:    process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    databaseUrl: process.env.DATABASE_URL,
};