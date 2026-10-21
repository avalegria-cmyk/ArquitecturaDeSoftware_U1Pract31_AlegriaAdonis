const express = require('express');
const soap= require('soap')
const fs = require('fs')
const path = require('path')

const app = express();
const port = Number(process.env.PORT || 3000);

app.use(express.static(path.join(__dirname, 'public')));

const pacientes = {
    1: { id: 1, nombre: 'Juan Mendez', identificacion: '123456' },
    2: { id: 2, nombre: 'María González', identificacion: '123457' },
    3: { id: 3, nombre: 'Pedro Ramírez', identificacion: '123458' }
};

let siguienteId = 4;

function errorCliente(mensaje) {
    return { Fault: { faultcode: 'soap:Client', faultstring: mensaje } };
}

const servicioPaciente = {
    ServicioPacientes: {
        ServicioPacientesPort: {
            consultarPaciente(args, callback) {
                const id = Number(args.pacienteId);
                const paciente = pacientes[id];
                
                if (!paciente) {
                    return callback(errorCliente(`Paciente con ID ${id} no encontrado`));
                }
                return callback(null, paciente);
            },
            insertarPaciente(args, callback) {
                args = args || {};
                const nombre = typeof args.nombre === 'string' ? args.nombre.trim() : '';
                const identificacion = typeof args.identificacion === 'string'
                    ? args.identificacion.trim() : '';

                if (!nombre) {
                    return callback(errorCliente('El nombre es obligatorio'));
                }
                if (!/^[0-9]+$/.test(identificacion)) {
                    return callback(errorCliente('La identificación debe contener solo dígitos'));
                }
                if (Object.values(pacientes).some(p => p.identificacion === identificacion)) {
                    return callback(errorCliente('Ya existe un paciente con esa identificación'));
                }

                const paciente = { id: siguienteId++, nombre, identificacion };
                pacientes[paciente.id] = paciente;
                return callback(null, paciente);
            },
        },
    },
};

const wsdl = fs.readFileSync(
    path.join(__dirname, 'contrato.wsdl'), 'utf8')
    .replace('http://localhost:3000/pacientes', `http://localhost:${port}/pacientes`);

const servidor = app.listen(port, (error) => {
    if (error) {
        if (error.code === 'EADDRINUSE') {
            console.error(`No se pudo iniciar: el puerto ${port} está ocupado por otro proceso.`);
            console.error('Detén el servidor anterior con Ctrl+C o usa otro puerto: PORT=3001 node servidor.js');
        } else {
            console.error('No se pudo iniciar el servidor:', error.message);
        }
        process.exitCode = 1;
        return;
    }
    soap.listen(servidor, '/pacientes', servicioPaciente, wsdl
    );
    console.log(`Servidor SOAP escuchando en http://localhost:${port}/pacientes?wsdl`);
    console.log(`Interfaz web: http://localhost:${port}`);
});
