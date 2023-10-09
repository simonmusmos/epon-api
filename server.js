const express= require('express');
require("dotenv").config();
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const db = require('./db');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");
 
const mysqlStore = require('express-mysql-session')(session);
 
 
 
 
 
const PORT = process.env.PORT || 3000;
const IN_PROD = process.env.NODE_ENV === 'production'
const TWO_HOURS = 1000 * 60 * 60 * 2
 
const options ={
    connectionLimit: 10,
    password: process.env.DB_PASS,
    user: process.env.DB_USER,
    database: process.env.MYSQL_DB,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    createDatabaseTable: true
     
 
 
}
const pool = mysql.createPool(options);
 
  
const  sessionStore = new mysqlStore(options, pool);
 
  
 
 
const app=express();
 
 
app.use(bodyParser.urlencoded({
    extended: true
}));
 
app.use(bodyParser.json())
 
 
app.use(session({
    name: process.env.SESS_NAME,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    secret: process.env.SESS_SECRET,
    cookie: {
        maxAge: TWO_HOURS,
        sameSite: true,
        secure: IN_PROD
    }
}))
 
 
const redirectLogin = (req, res, next) =>{
    if(!req.session.userId){
        res.redirect('/login')
    }else{
            next()
        }
 }
 
 
 
 const redirectHome = (req, res, next) =>{
    if(req.session.userId){
        res.redirect('/home')
    }else{
            next()
        }
 }
 
app.get('/', (req, res)=>{
//     const { userId } = req.session
//     console.log(userId);
//     res.send(`
//     <h1> Welcome!</h1>
//     ${userId ?`<a href = '/home'> Home </a>
//     <form method='post' action='/logout'>
//     <button>Logout</button>
//     </form>` : `<a href = '/login'> Login </a>
//     <a href = '/register'> Register </a>
// `}
//     `)
    return 'Hello World mga bano!';
})

app.get('/home', redirectLogin, async(req,res)=>{
    const {userId} =req.session
     if(userId){
    try{
        const user = await db.getUser(userId);
        console.log(user)
        req.user = user;
        res.send(`
        <h1>Home</h1>
        <a href='/'>Main</a>
        <ul>
        <li> Name: ${user[0].first_name} </li>
        <li> Phone:${user[0].phone} </li>
        </ul>
     
        `)
         
    } catch(e) {
        console.log(e);
        res.sendStatus(404);
    }
}
    
})
 
 
app.get('/login',redirectHome, (req,res)=>{
    res.send(`
    <h1>Login</h1>
    <form method='post' action='/login'>
    <input type='text' name='phone' placeholder='Phone' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `)
})
 
 
app.get('/register',redirectHome, (req,res)=>{
    res.send(`
    <h1>Register</h1>
    <form method='post' action='/Register'>
    <input type='text' name='firstName' placeholder='First Name' required />
    <input type='text' name='lastName' placeholder='Last Name' required />
    <input type='test' name='phone' placeholder='Phone' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/login'>Login</a>
    `)
})
 
 
 
app.post('/login',redirectHome, async(req, res, next)=>{
    try{ 
    const phone = req.body.phone;
    let password = req.body.password;
    user = await db.getUserByPhone(phone);
     
    if(!user){
        return res.send({
            message: "Invalid phone or password"
        })
    }
 
    const isValidPassword = compareSync(password, user.password);
    if(isValidPassword){
        user.password = undefined;
        req.session.userId = user.id
        return res.redirect('/home');
    }  else{
         res.send(
             "Invalid phone or password"
        );
        return res.redirect('/login')
    } 
 
    } catch(e){
        console.log(e);
    }
});
 
 
 
app.post('/register', redirectHome, async (req, res, next)=>{
    try{
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const phone = req.body.phone;
        let password = req.body.password;
 
 
              if (!firstName || !lastName || !phone || !password) {
                return res.sendStatus(400);
             }
 
             const salt = genSaltSync(10);
             password = hashSync(password, salt);
 
              
 
        const user =  await db.insertUser(firstName, lastName, phone, password).then(insertId=>{return db.getUser(insertId);});
        req.session.userId = user.id
            return res.redirect('/register') 
 
    } catch(e){    
        console.log(e);
        res.sendStatus(400);
    }
});
 
 
app.post('/logout', redirectLogin, (req, res)=>{
    req.session.destroy(err => {
        if(err){
            return res.redirect('/home')
        }
        sessionStore.close()
        res.clearCookie(process.env.SESS_NAME)
        res.redirect('/login')
    })
 
})
 
 
 
 
 
 
app.listen(PORT, ()=>{console.log(`server is listening on ${PORT}`)});