const soap = require('soap');

const ejecutarCliente = async () => {
    const wsdlUrl = process.env.WSDL_URL || 'http://localhost:3000/pacientes?wsdl';

    try {
        const client = await soap.createClientAsync(wsdlUrl);
        const [operacion = 'consultar', valor = '1', identificacion] = process.argv.slice(2);
        let respuesta;

        if (operacion === 'insertar') {
            if (!process.argv[3] || !identificacion) {
                throw new Error('Uso: node cliente.js insertar "Nombre Apellido" identificacion');
            }
            [respuesta] = await client.insertarPacienteAsync({ nombre: valor, identificacion });
            console.log('Paciente insertado correctamente');
        } else if (operacion === 'consultar') {
            [respuesta] = await client.consultarPacienteAsync({ pacienteId: Number(valor) });
        } else {
            throw new Error('Operación no válida. Usa consultar o insertar.');
        }

        console.log('Id Paciente:' + respuesta.id);
        console.log('Nombre Paciente:' + respuesta.nombre);
        console.log('Identificación Paciente:' + respuesta.identificacion);
    } catch (error) {
        console.error('Error:', error.message);
        process.exitCode = 1;
    }
};

ejecutarCliente();
