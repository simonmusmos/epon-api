	
require("dotenv").config();
const express =require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql');
const session = require('express-session');
const db = require('./db');
const { hashSync, genSaltSync, compareSync } = require("bcrypt");

const mysqlStore = require('express-mysql-session')(session);

const PORT= process.env.APP_PORT;
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

// const apiRouter = require('./apiRouter');

const app = express();

// const PORT= process.env.APP_PORT;
 
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
 
// app.use('/apiRouter',apiRouter)
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
app.listen(PORT, ()=>{
    console.log(`server is listening  on ${PORT}`);
});

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
    const { userId } = req.session
    console.log(userId);
    res.send(`
    <h1> Welcome!</h1>
    ${userId ?`<a href = '/home'> Home </a>
    <form method='post' action='/logout'>
    <button>Logout</button>
    </form>` : `<a href = '/login'> Login </a>
    <a href = '/register'> Register </a>
`}
    `)
})

app.post('/register', redirectHome, async (req, res, next)=>{
    try{
        const firstName = req.body.firstName;
        const lastName = req.body.lastName;
        const email = req.body.email;
        let password = req.body.password;
 
 
              if (!firstName || !lastName || !email || !password) {
                return res.sendStatus(400);
             }
 
             const salt = genSaltSync(10);
             password = hashSync(password, salt);
 
              
 
        const user =  await db.insertUser(firstName, lastName, email, password).then(insertId=>{return db.getUser(insertId);});
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

app.get('/login', redirectHome, (req,res)=>{
    res.send(`
    <h1>Login</h1>
    <form method='post' action='/login'>
    <input type='email' name='email' placeholder='Email' required />
    <input type='password' name='password' placeholder='password' required/>
    <input type='submit' />
    </form>
    <a href='/register'>Register</a>
    `)
})

app.post('/login', redirectHome, async(req, res, next)=>{
    try{ 
    const email = req.body.email;
    let password = req.body.password;
    user = await db.getUserByEmail(email);
     
    if(!user){
        return res.send({
            message: "Invalid email or password"
        })
    }
 
    const isValidPassword = compareSync(password, user.password);
    if(isValidPassword){
        user.password = undefined;
        req.session.userId = user.id
        return res.redirect('/home');
    }  else{
         res.send(
             "Invalid email or password"
        );
        return res.redirect('/login')
    } 
 
    } catch(e){
        console.log(e);
    }
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
        <li> Email:${user[0].email} </li>
        </ul>
     
        `)
         
    } catch(e) {
        console.log(e);
        res.sendStatus(404);
    }
}
    
})

module.exports = app;