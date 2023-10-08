const mysql =require('mysql')

const pool = mysql.createPool({
    connectionLimit: process.env.CONNECTION_LIMIT,    // the number of connections node.js will hold open to our database
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    database: process.env.MYSQL_DB,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT
 
});
 
let db = {}; //create an empty object you will use later to write  and export your queries. 

db.getUser = (id) =>{
    return new Promise((resolve, reject)=>{
        pool.query('SELECT * FROM users WHERE id= ?', [id], (error, user)=>{
            if(error){
                return reject(error);
            }
            return resolve(user);
        });
    });
};

db.getUserByPhone = (phone) =>{
    return new Promise((resolve, reject)=>{
        pool.query('SELECT * FROM users WHERE phone = ?', [phone], (error, users)=>{
            if(error){
                return reject(error);
            }
            return resolve(users[0]);
        });
    });
};

db.insertUser = (firstName, lastName, phone, password) =>{
    return new Promise((resolve, reject)=>{
        pool.query('INSERT INTO users (first_name, last_name, phone, password, created_at) VALUES (?, ?, ?, ?, NOW())', [firstName, lastName, phone, password], (error, result)=>{
            if(error){
                return reject(error);
            }
             
              return resolve(result.insertId);
        });
    });
};

module.exports = db