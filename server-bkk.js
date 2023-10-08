const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/hello_world', (req,res)=>{
    res.send('Hello World');
})

app.listen(port,()=> {
    console.log('listen port 3000');
})