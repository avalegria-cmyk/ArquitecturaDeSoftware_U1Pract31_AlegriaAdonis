const mensaje = document.querySelector('#mensaje');
const datos = document.querySelector('#datos');

function escaparXml(valor) {
  return String(valor).replace(/[<>&"']/g, caracter => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;'
  })[caracter]);
}

async function llamarSoap(operacion, parametros) {
  const contenido = Object.entries(parametros)
    .map(([campo, valor]) => `<pac:${campo}>${escaparXml(valor)}</pac:${campo}>`).join('');
  const respuesta = await fetch('/pacientes', {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: operacion },
    body: `<?xml version="1.0" encoding="UTF-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:pac="http://hospital.example.com/pacientes">
        <soap:Body><pac:${operacion}>${contenido}</pac:${operacion}></soap:Body>
      </soap:Envelope>`
  });
  const xml = new DOMParser().parseFromString(await respuesta.text(), 'text/xml');
  const texto = campo => xml.getElementsByTagNameNS('*', campo)[0]?.textContent;
  if (texto('parsererror')) throw new Error('El servidor devolvió una respuesta inválida.');
  if (xml.getElementsByTagNameNS('*', 'Fault').length) {
    throw new Error(texto('faultstring') || texto('Text') || 'No se pudo completar la operación.');
  }
  if (!respuesta.ok || !texto('id')) throw new Error('No se pudo obtener el paciente.');
  return { id: texto('id'), nombre: texto('nombre'), identificacion: texto('identificacion') };
}

async function ejecutar(evento, operacion) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const botones = document.querySelectorAll('button');
  botones.forEach(boton => boton.disabled = true);
  datos.hidden = true;
  mensaje.className = '';
  mensaje.textContent = 'Procesando…';
  try {
    const parametros = Object.fromEntries(new FormData(formulario));
    const paciente = await llamarSoap(operacion, parametros);
    for (const [campo, valor] of Object.entries(paciente)) {
      document.querySelector(`#dato-${campo}`).textContent = valor;
    }
    datos.hidden = false;
    mensaje.className = 'exito';
    mensaje.textContent = operacion === 'insertarPaciente'
      ? 'Paciente registrado correctamente.' : 'Paciente encontrado.';
    document.querySelector('#pacienteId').value = paciente.id;
    if (operacion === 'insertarPaciente') formulario.reset();
  } catch (error) {
    mensaje.className = 'error';
    mensaje.textContent = error instanceof TypeError
      ? 'No se pudo conectar. Comprueba que el servidor esté encendido.' : error.message;
  } finally {
    botones.forEach(boton => boton.disabled = false);
  }
}

document.querySelector('#registro').addEventListener('submit', evento => ejecutar(evento, 'insertarPaciente'));
document.querySelector('#consulta').addEventListener('submit', evento => ejecutar(evento, 'consultarPaciente'));
