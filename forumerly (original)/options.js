module.exports = {
  port: '3000',
  mongoDB: 'mongodb://lbsadmin:lbsc0urse_20xx@127.0.0.1:27017/?authSource=admin',
  redis: {
    host: '127.0.0.1',
    port: '6379',
    db: 0,           // Redis DB 0 — vulnerable instance
    logErrors: true
  }
};