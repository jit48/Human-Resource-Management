var employees = [
    {
        username: "hello world",
        employeeId: 1234
    },
    {
        username: "hello world1",
        employeeId: 5678
    },
    {
        username: "hello world2",
        employeeId: 91011
    }
]

function getinfo() {
    var username = document.getElementById("username").value
    var empId = document.getElementById("employeeId").value
    
    for(i=0;i<employees.length;i++){
        if(username == employees[i].username && empId == employees[i].employeeId){
            console.log("Welcome to the website!!!!")
        }
    }
}