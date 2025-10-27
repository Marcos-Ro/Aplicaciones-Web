/* script.js - lógica compartida para todas las páginas
   - Maneja login (sesión), almacenamiento local de:
     pacientes, historias, citas, análisis de imagen (base64)
   - Control de acceso: cada página lo revisa y redirige si no hay sesión.
*/

// ---------- Utilidades ----------
const STORAGE = {
  pacientes: 'sistema_pacientes',
  historias: 'sistema_historias',
  citas: 'sistema_citas',
  analisis: 'sistema_analisis',
  session: 'sistema_session'
};

function read(key){
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}
function write(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

// Inicializar arrays si no existen
if(!localStorage.getItem(STORAGE.pacientes)) write(STORAGE.pacientes, []);
if(!localStorage.getItem(STORAGE.historias)) write(STORAGE.historias, []);
if(!localStorage.getItem(STORAGE.citas)) write(STORAGE.citas, []);
if(!localStorage.getItem(STORAGE.analisis)) write(STORAGE.analisis, []);

// ---------- Credenciales de prueba ----------
const CREDENCIALES = {
  odontologo: { user: 'doctor@uleam.edu.ec', pass: '12345', nombre: 'Dr. Pérez' },
  paciente: { user: '0102030405', pass: 'abc123', nombre: 'Paciente de Prueba' }
};

// ---------- Sesión ----------
function setSession(sessionObj){
  localStorage.setItem(STORAGE.session, JSON.stringify(sessionObj));
}
function clearSession(){
  localStorage.removeItem(STORAGE.session);
}
function getSession(){
  const s = localStorage.getItem(STORAGE.session);
  return s ? JSON.parse(s) : null;
}

// ---------- LOGIN (Proyecto_HTML.html) ----------
document.addEventListener('DOMContentLoaded', ()=>{

  // Si estamos en Proyecto_HTML.html -> configurar login
  if(document.getElementById('loginForm')){
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', e=>{
      e.preventDefault();
      const user = document.getElementById('user').value.trim();
      const pass = document.getElementById('pass').value.trim();
      const rol = document.querySelector('input[name="rol"]:checked').value;

      if(rol === 'odontologo'){
        if(user === CREDENCIALES.odontologo.user && pass === CREDENCIALES.odontologo.pass){
          setSession({ role: 'odontologo', user: user, nombre: CREDENCIALES.odontologo.nombre });
          window.location.href = 'Inter_Odontologo.html';
          return;
        }
      } else {
        if(user === CREDENCIALES.paciente.user && pass === CREDENCIALES.paciente.pass){
          setSession({ role: 'paciente', user: user, nombre: CREDENCIALES.paciente.nombre });
          window.location.href = 'Inter_paciente.html';
          return;
        }
      }
      alert('Credenciales inválidas (usa las de prueba indicadas si es necesario).');
    });
  }

  // ---------- Control de acceso y funciones compartidas en páginas ----------
  const session = getSession();

  // Si estamos en Inter_Odontologo.html
  if(document.getElementById('saludoOdontologo')){
    if(!session || session.role !== 'odontologo'){ window.location.href = 'Proyecto_HTML.html'; return; }
    document.getElementById('saludoOdontologo').innerText = `Bienvenido, ${session.nombre}`;
    document.getElementById('logoutBtn').addEventListener('click', ()=>{ clearSession(); window.location.href='Proyecto_HTML.html';});

    // Mostrar citas al hacer click
    document.getElementById('toggleCitasBtn').addEventListener('click', ()=>{
      document.getElementById('citasSection').classList.toggle('hidden');
      llenarTablaCitas();
    });
  }

// registrar_historia.html
if(document.getElementById('historiaForm')){
  if(!session || session.role !== 'odontologo'){   // ✅ FIX #1
    window.location.href = 'Proyecto_HTML.html'; 
    return; 
  }

  document.getElementById('logoutBtn2').addEventListener('click', ()=>{
    clearSession(); 
    window.location.href='Proyecto_HTML.html';
  });

  document.getElementById('backToMenu').addEventListener('click', ()=>{
    window.location.href='Inter_Odontologo.html';
  });

  const form = document.getElementById('historiaForm');
  form.addEventListener('submit', e=>{
    e.preventDefault();

    const cedula = document.getElementById('hist_cedula').value.trim();
    const nombre = document.getElementById('hist_nombre').value.trim();
    const edad = document.getElementById('hist_edad').value.trim();
    const examen = document.getElementById('hist_examen').value.trim();
    const diagnostico = document.getElementById('hist_diagnostico').value.trim();
    const tratamiento = document.getElementById('hist_tratamiento').value.trim();
    const antecedentes = document.getElementById('hist_antecedentes').value.trim();
    const fecha = new Date().toISOString();

    if(!cedula || !nombre || !diagnostico || !tratamiento){   // ✅ FIX #2
      alert('⚠️ Complete los campos obligatorios.');
      return;
    }

    const historias = read(STORAGE.historias);
    const nuevaHistoria = {
      id: Date.now(),
      cedula, nombre, edad, examen, diagnostico, tratamiento, antecedentes, fecha
    };

    historias.push(nuevaHistoria);
    write(STORAGE.historias, historias);

    const pacientes = read(STORAGE.pacientes);
    if(!pacientes.some(p=>p.cedula === cedula)){
      pacientes.push({ cedula, nombre, edad });
      write(STORAGE.pacientes, pacientes);
    }

    alert('✅ Historia clínica registrada correctamente.');
    form.reset();
  });
}
  // ver_historiales.html
  if(document.getElementById('listaPacientes')){
    if(!session || session.role !== 'odontologo'){ window.location.href = 'Proyecto_HTML.html'; return; }
    document.getElementById('logoutBtn3').addEventListener('click', ()=>{ clearSession(); window.location.href='Proyecto_HTML.html';});
    document.getElementById('volverLista').addEventListener('click', ()=> {
      document.getElementById('detalleSection').classList.add('hidden');
      document.getElementById('listaPacientes').parentElement.classList.remove('hidden');
    });

    const listaEl = document.getElementById('listaPacientes');
    function cargarPacientes(){
      const pacientes = read(STORAGE.pacientes);
      if(pacientes.length === 0) listaEl.innerHTML = '<li>No hay pacientes registrados.</li>';
      else{
        listaEl.innerHTML = '';
        pacientes.forEach(p=>{
          const li = document.createElement('li');
          li.innerHTML = `<strong>${p.nombre}</strong> — ${p.cedula} <button data-cedula="${p.cedula}" class="verHist">Ver historial</button>`;
          listaEl.appendChild(li);
        });
        document.querySelectorAll('.verHist').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            const ced = btn.getAttribute('data-cedula');
            mostrarHistorial(ced);
          });
        });
      }
    }
    function mostrarHistorial(cedula){
      const historias = read(STORAGE.historias).filter(h => h.cedula === cedula);
      const detalle = document.getElementById('detalle');
      if(historias.length === 0) detalle.innerHTML = '<p>No hay historias para este paciente.</p>';
      else{
        detalle.innerHTML = '';
        historias.forEach(h=>{
          const div = document.createElement('div');
          div.className = 'card';
          let html = `<p><strong>Fecha:</strong> ${new Date(h.fecha).toLocaleString()}</p>`;
          html += `<p><strong>Nombre:</strong> ${h.nombre} — <strong>Cédula:</strong> ${h.cedula} — <strong>Edad:</strong> ${h.edad}</p>`;
          html += `<p><strong>Examen:</strong> ${h.examen}</p>`;
          html += `<p><strong>Diagnóstico:</strong> ${h.diagnostico}</p>`;
          html += `<p><strong>Tratamiento:</strong> ${h.tratamiento}</p>`;
          html += `<p><strong>Antecedentes:</strong> ${h.antecedentes}</p>`;

          // Si tiene análisis adjuntos, mostrarlos
          if(h.analisis && h.analisis.length){
            html += '<h4>Análisis de imagen:</h4>';
            h.analisis.forEach(a=>{
              html += `<div class="card"><p><strong>Observaciones:</strong> ${a.observaciones}</p>`;
              html += `<img src="${a.image}" alt="imagen-analisis" style="max-width:100%;border-radius:8px"></div>`;
            });
          }

          div.innerHTML = html;
          detalle.appendChild(div);
        });
      }
      document.getElementById('detalleSection').classList.remove('hidden');
      document.getElementById('listaPacientes').parentElement.classList.add('hidden');
    }

    // Búsqueda por cédula
    document.getElementById('btnBuscar').addEventListener('click', ()=>{
      const ced = document.getElementById('buscarCedula').value.trim();
      if(!ced) return cargarPacientes();
      mostrarHistorial(ced);
    });

    cargarPacientes();
  }

  // analisis_imagen.html
  if(document.getElementById('analisisForm')){
    if(!session || session.role !== 'odontologo'){ window.location.href = 'Proyecto_HTML.html'; return; }
    document.getElementById('logoutBtn4').addEventListener('click', ()=>{ clearSession(); window.location.href='Proyecto_HTML.html';});
    document.getElementById('backMenuAna').addEventListener('click', ()=> window.location.href='Inter_Odontologo.html');

    const form = document.getElementById('analisisForm');
    const fileInput = document.getElementById('ana_file');
    const preview = document.getElementById('previewWrapper');
    const previewImg = document.getElementById('previewImg');
    const listaAnalisis = document.getElementById('listaAnalisis');

    fileInput.addEventListener('change', (ev)=>{
      const f = ev.target.files[0];
      if(!f) return;
      if(!f.type.startsWith('image/')){ alert('Solo se permiten imágenes.'); fileInput.value=''; return; }
      const reader = new FileReader();
      reader.onload = function(evt){
        previewImg.src = evt.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(f);
    });

    form.addEventListener('submit', e=>{
      e.preventDefault();
      const cedula = document.getElementById('ana_cedula').value.trim();
      const observ = document.getElementById('ana_observaciones').value.trim();
      const file = fileInput.files[0];
      if(!cedula || !file){ alert('Cédula e imagen son requeridos'); return; }

      const reader = new FileReader();
      reader.onload = function(evt){
        const base64 = evt.target.result;
        // Guardar análisis
        const analisis = read(STORAGE.analisis);
        const nuevo = { id: Date.now(), cedula, observaciones: observ, image: base64, fecha: new Date().toISOString() };
        analisis.push(nuevo);
        write(STORAGE.analisis, analisis);

        // También vincular con historias si existe alguna historia para esa cédula
        const historias = read(STORAGE.historias);
        let modified = false;
        for(let i=0;i<historias.length;i++){
          if(historias[i].cedula === cedula){
            if(!historias[i].analisis) historias[i].analisis = [];
            historias[i].analisis.push(nuevo);
            modified = true;
          }
        }
        if(modified) write(STORAGE.historias, historias);

        alert('Análisis guardado correctamente.');
        form.reset();
        preview.classList.add('hidden');
        cargarAnalisis();
      };
      reader.readAsDataURL(file);
    });

    function cargarAnalisis(){
      const arr = read(STORAGE.analisis);
      if(arr.length === 0) listaAnalisis.innerHTML = '<li>No hay análisis guardados.</li>';
      else{
        listaAnalisis.innerHTML = '';
        arr.slice().reverse().forEach(a=>{
          const li = document.createElement('li');
          li.innerHTML = `<strong>${a.cedula}</strong> — ${new Date(a.fecha).toLocaleString()}<br>
                          <em>${a.observaciones || ''}</em>
                          <div style="margin-top:8px"><img src="${a.image}" style="max-width:200px;border-radius:8px"></div>`;
          listaAnalisis.appendChild(li);
        });
      }
    }

    cargarAnalisis();
  }

  // paciente.html
  if(document.getElementById('pac_resultados')){
    if(!session || session.role !== 'paciente'){ window.location.href = 'Proyecto_HTML.html'; return; }
    document.getElementById('logoutBtn5').addEventListener('click', ()=>{ clearSession(); window.location.href='Proyecto_HTML.html';});
    const pacCed = document.getElementById('pac_cedula');
    if(/^\d+$/.test(session.user)) pacCed.value = session.user;

    document.getElementById('pac_buscar').addEventListener('click', ()=>{
      const ced = pacCed.value.trim();
      const res = document.getElementById('pac_resultados');
      res.innerHTML = '';
      if(!ced){ res.innerHTML = '<p>Ingrese una cédula para consultar.</p>'; return; }

      // citas
      const citas = read(STORAGE.citas).filter(c=>c.cedula === ced);
      let html = '<h4>Citas</h4>';
      if(citas.length === 0) html += '<p>No hay citas registradas.</p>';
      else {
        html += '<ul>';
        citas.forEach(c=> html += `<li>${c.fecha} ${c.hora} - ${c.odontologo}</li>`);
        html += '</ul>';
      }

      // historias y analisis
      const historias = read(STORAGE.historias).filter(h => h.cedula === ced);
      html += '<h4>Historial Clínico</h4>';
      if(historias.length === 0) html += '<p>No hay historiales registrados.</p>';
      else {
        historias.forEach(h=>{
          html += `<div class="card"><p><strong>Fecha:</strong> ${new Date(h.fecha).toLocaleString()}</p>`;
          html += `<p><strong>Diagnóstico:</strong> ${h.diagnostico}</p>`;
          html += `<p><strong>Tratamiento:</strong> ${h.tratamiento}</p>`;
          if(h.analisis && h.analisis.length){
            html += '<h5>Análisis de imagen:</h5>';
            h.analisis.forEach(a=>{
              html += `<p><em>${a.observaciones}</em></p><img src="${a.image}" style="max-width:300px;border-radius:8px">`;
            });
          }
          html += '</div>';
        });
      }

      res.innerHTML = html;
    });
  }

  // Función para llenar tabla de citas (Inter_Odontologo.html)
  function llenarTablaCitas(){
    const tabla = document.querySelector('#tablaCitas tbody');
    if(!tabla) return;
    const citas = read(STORAGE.citas);
    tabla.innerHTML = '';
    citas.forEach(c=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${c.cedula}</td><td>${c.fecha}</td><td>${c.hora}</td><td>${c.odontologo}</td>`;
      tabla.appendChild(tr);
    });
  };
  const btnVoler = document.getElementById("btnVolver");
  if (btnVolver){
    btnVolver.addEventListener("click", function(){
        window.location.href = "Inter_Odontologo.html";
    });
  }
});
// --- Gestión de Citas ---
document.addEventListener("DOMContentLoaded", function() {
  const formCita = document.getElementById("formCita");
  const tablaCitas = document.querySelector("#tablaCitas tbody");
  const btnVolverCitas = document.getElementById("btnVolverCitas");

  if (formCita) {
    // Cargar citas previas
    const citas = JSON.parse(localStorage.getItem("citas")) || [];
    mostrarCitas(citas);

    // Registrar nueva cita
    formCita.addEventListener("submit", function(e) {
      e.preventDefault();

      const nuevaCita = {
        paciente: document.getElementById("nombrePaciente").value,
        fecha: document.getElementById("fechaCita").value,
        hora: document.getElementById("horaCita").value,
        motivo: document.getElementById("motivoCita").value
      };

      citas.push(nuevaCita);
      localStorage.setItem("citas", JSON.stringify(citas));
      mostrarCitas(citas);
      formCita.reset();
      alert("✅ Cita registrada correctamente.");
    });
  }

  // Mostrar citas en la tabla
 function mostrarCitas(lista) {
    tablaCitas.innerHTML = "";
    lista.forEach(cita => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${cita.paciente}</td>
        <td>${cita.fecha}</td>
        <td>${cita.hora}</td>
        <td>${cita.motivo}</td>
      `;
      tablaCitas.appendChild(fila);
    });
  }

  // Botón volver al menú
  if (btnVolverCitas) {
    btnVolverCitas.addEventListener("click", () => {
      window.location.href = "Inter_Odontologo.html";
    });
  }
});
// --- Portal del Paciente: ver citas e historial clínico ---
document.addEventListener("DOMContentLoaded", function() {
  const tablaCitasPaciente = document.querySelector("#tablaCitasPaciente tbody");
  const historialPaciente = document.getElementById("historialPaciente");
  const btnVolverInicio = document.getElementById("btnVolverInicio");

  // Paciente de prueba
  const pacienteActual = "Juan Pérez";

  // --- Mostrar citas ---
  if (tablaCitasPaciente) {
    const citas = JSON.parse(localStorage.getItem("citas")) || [];
    const citasPaciente = citas.filter(c => c.paciente === pacienteActual);

    if (citasPaciente.length > 0) {
      citasPaciente.forEach(cita => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${cita.fecha}</td>
          <td>${cita.hora}</td>
          <td>${cita.motivo}</td>
        `;
        tablaCitasPaciente.appendChild(fila);
      });
    } else {
      const fila = document.createElement("tr");
      fila.innerHTML = `<td colspan="3">No tienes citas programadas.</td>`;
      tablaCitasPaciente.appendChild(fila);
    }
  }

  // --- Mostrar historial clínico ---
  if (historialPaciente) {
    const historiales = JSON.parse(localStorage.getItem("historiales")) || [];
    const historialesPaciente = historiales.filter(h => h.nombre === pacienteActual);

    if (historialesPaciente.length > 0) {
      historialesPaciente.forEach(historial => {
        const item = document.createElement("div");
        item.classList.add("historial-item");
        item.innerHTML = `
          <p><strong>Fecha:</strong> ${historial.fecha || 'Sin fecha registrada'}</p>
          <p><strong>Diagnóstico:</strong> ${historial.diagnostico}</p>
          <p><strong>Tratamiento:</strong> ${historial.tratamiento}</p>
          <p><strong>Observaciones:</strong> ${historial.observaciones}</p>
        `;
        historialPaciente.appendChild(item);
      });
    } else {
      historialPaciente.innerHTML = `<p>No se han registrado historiales clínicos.</p>`;
    }
  }

  // --- Botón para volver al inicio ---
  if (btnVolverInicio) {
    btnVolverInicio.addEventListener("click", () => {
      window.location.href = "Proyecto_HTML.html";
    });
  }
});
