const express =require('express');
const apiRouter = express.Router();
const db = require('./db.js');
 
apiRouter.get('/', async (req, res, next)=>{
    try {
        const employees = await db.getAllEmployees();
        res.status(200).json({employees: employees});
    } catch(e) {
        console.log(e);
        res.sendStatus(500);
    }
});
 
apiRouter.param('employeeId', async (req, res, next, employeeId)=> {
    try{
        const employee = await db.getOneEmployee(employeeId);
        req.employee = employee;
        next(); // go to apiRouter.get('/:employeeId')
    } catch(e) {
        console.log(e);
        res.sendStatus(404);
    }
});
 
apiRouter.get('/:employeeId',  (req, res, next)=>{
    res.status(200).json({employee: req.employee});
});
 
 
apiRouter.post('/',  async (req, res, next)=>{
    try{
        const name = req.body.employee.name;
        const position = req.body.employee.position;
        const wage = req.body.employee.wage;
         
              if (!name || !position || !wage) {
                return res.sendStatus(400);
             }
 
        const employee =  await db.insertEmployee(name, position, wage).then(insertId=>{return db.getOneEmployee(insertId);});
        res.json({employee: employee});
 
    } catch(e){
        console.log(e);
        res.sendStatus(400);
    }
});
 
 
apiRouter.put('/:employeeId',  async (req, res, next)=>{
    try{
        const name = req.body.employee.name;
        const position = req.body.employee.position;
        const wage = req.body.employee.wage;
        const employeeId= req.params.employeeId;
   
              if (!name || !position || !wage) {
                return res.sendStatus(400);
             }
 
        const employee =  await db.updateEmployee(name, position, wage, employeeId).then(()=>{return db.getOneEmployee(employeeId);});
        res.json({employee: employee});
         
    } catch(e){
        console.log(e);
        res.sendStatus(400);
    }
});
 
 
 
apiRouter.delete('/:employeeId', async (req, res, next)=>{
    try{
        const employeeId = req.params.employeeId;
        const response = await db.deleteEmployee(employeeId);
        return res.sendStatus(204);
 
    } catch(e){
        console.log(e);
    }
})
 
 
 
module.exports = apiRouter;