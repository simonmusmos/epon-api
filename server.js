const express = require('express');
const app = express();
const port = 3000;
app.listen(port,()=> {
    console.log('listen port 3000');
})

app.get('/hello_world', (req,res)=>{
    res.send('Hello World');
})