const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando sistema de desenvolvimento...\n');

// Função para executar comandos
function runCommand(command, args, cwd, name) {
  return new Promise((resolve, reject) => {
    console.log(`📦 Iniciando ${name}...`);
    
    const process = spawn(command, args, {
      cwd: cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} finalizado com sucesso`);
        resolve();
      } else {
        console.log(`❌ ${name} finalizado com erro: ${code}`);
        reject(new Error(`${name} falhou com código ${code}`));
      }
    });

    process.on('error', (error) => {
      console.log(`❌ Erro ao iniciar ${name}:`, error.message);
      reject(error);
    });
  });
}

// Verificar se estamos no diretório correto
const packageJsonPath = path.join(__dirname, 'package.json');
const frontendPackageJsonPath = path.join(__dirname, 'frontend', 'package.json');

try {
  require(packageJsonPath);
  require(frontendPackageJsonPath);
} catch (error) {
  console.error('❌ Erro: Execute este script na raiz do projeto');
  process.exit(1);
}

// Iniciar backend e frontend em paralelo
Promise.all([
  runCommand('npm', ['run', 'dev'], __dirname, 'Backend'),
  runCommand('npm', ['start'], path.join(__dirname, 'frontend'), 'Frontend')
]).catch((error) => {
  console.error('❌ Erro ao iniciar o sistema:', error.message);
  process.exit(1);
});
