module.exports = {
  port: '3001',
  mongoDB: 'mongodb://lbsadmin:lbsc0urse_20xx@127.0.0.1:27017/?authSource=admin',
  redis: {
    host: '127.0.0.1',
    port: '6379',
    db: 1,           // Redis DB 1 — fixed instance (separate from vulnerable on DB 0)
    logErrors: true
  }
};