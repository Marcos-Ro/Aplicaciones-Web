const form = document.getElementById("formCliente");
const tabla = document.getElementById("tablaClientes").querySelector("tbody");
let clientes = [];

form.addEventListener("submit", function(event){
    event.preventDefault();

    let cliente = {
        cedula: document.getElementById("cedula").value,
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("direccion").value,
        email: document.getElementById("email").value,
        telefono: document.getElementById("telefono").value
    };

    clientes.push(cliente);
    tabla.innerHTML = "";

    clientes.forEach(c => {
        let fila = `
            <tr>
                <td>${c.cedula}</td>
                <td>${c.nombre}</td>
                <td>${c.direccion}</td>
                <td>${c.email}</td>
                <td>${c.telefono}</td>
            </tr>
        `;
        tabla.innerHTML += fila;
    });

    form.reset();
});