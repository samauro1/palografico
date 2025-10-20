'use client';

import React, { useState, useRef } from 'react';
import { FileText, Download, Search, Upload, Mail, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import { pacientesService, avaliacoesService, agendamentosService } from '@/services/api';
import { webPkiService } from '@/services/webPkiService';
import { useAuth } from '@/contexts/AuthContext';
import { useConfiguracoes } from '@/contexts/ConfiguracoesContext';
import { formatDateToBrazilian, calculateAge } from '@/utils/dateUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function RelatoriosPage() {
  const { user: currentUser } = useAuth();
  const { configuracoes } = useConfiguracoes();
  const [activeTab, setActiveTab] = useState<'laudos' | 'declaracao' | 'estatisticas'>('laudos');
  
  // Estados para busca de laudo
  const [buscaLaudo, setBuscaLaudo] = useState('');
  const [laudoEncontrado, setLaudoEncontrado] = useState<any>(null);
  const [buscandoLaudo, setBuscandoLaudo] = useState(false);
  const [assinaturaImagem, setAssinaturaImagem] = useState<string | null>(null);
  
  // Estados para declaração
  const [buscaDeclaracao, setBuscaDeclaracao] = useState('');
  const [dadosDeclaracao, setDadosDeclaracao] = useState<any>(null);
  const [buscandoDeclaracao, setBuscandoDeclaracao] = useState(false);
  
  // Estados para assinatura digital
  const [certificadosDisponiveis, setCertificadosDisponiveis] = useState<any[]>([]);
  const [certificadoSelecionado, setCertificadoSelecionado] = useState<string>('');
  const [carregandoCertificados, setCarregandoCertificados] = useState(false);
  const [assinaturaDigitalData, setAssinaturaDigitalData] = useState<any>(null);
  const [assinandoDigitalmente, setAssinandoDigitalmente] = useState(false);
  const [mostrarModalPin, setMostrarModalPin] = useState(false);
  const [pinCertificado, setPinCertificado] = useState('');
  const [tentativasPin, setTentativasPin] = useState(0);
  
  // Refs para geração de PDF
  const laudoRef = useRef<HTMLDivElement>(null);
  const declaracaoRef = useRef<HTMLDivElement>(null);

  const handleAssinaturaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verificar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem (PNG, JPG, etc.)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Tamanho máximo: 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Verificar se a imagem carregou corretamente
        const img = new Image();
        img.onload = () => {
          setAssinaturaImagem(result);
          toast.success(`Assinatura carregada! (${img.width}x${img.height}px)`);
        };
        img.onerror = () => {
          toast.error('Erro ao carregar imagem. Verifique se o arquivo não está corrompido.');
        };
        img.src = result;
      };
      reader.onerror = () => {
        toast.error('Erro ao ler o arquivo. Tente novamente.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGerarPDFLaudo = async () => {
    if (!laudoRef.current) {
      toast.error('Elemento de laudo não encontrado');
      return;
    }

    try {
      toast.loading('Gerando PDF do laudo...');
      
      // Criar um elemento temporário apenas com o conteúdo do laudo
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000000';
      
      // Clonar apenas o conteúdo interno do laudo
      const laudoContent = laudoRef.current.cloneNode(true) as HTMLElement;
      
      // Remover elementos com classe no-print do clone
      const noPrintElements = laudoContent.querySelectorAll('.no-print');
      noPrintElements.forEach(el => el.remove());
      
      // Adicionar o conteúdo clonado ao elemento temporário
      tempDiv.appendChild(laudoContent);
      document.body.appendChild(tempDiv);
      
      // Capturar apenas o elemento temporário com escala reduzida
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5, // Reduzido de 2 para 1.5 (reduz tamanho em ~44%)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });

      // Remover o elemento temporário
      document.body.removeChild(tempDiv);

      // Usar JPEG com compressão (menor que PNG)
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // Qualidade 85% (reduz tamanho significativamente)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensões da imagem
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calcular proporção para ajustar ao PDF
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // Centralizar a imagem no PDF
      const imgX = (pdfWidth - finalWidth) / 2;
      const imgY = 10;

      // Adicionar a imagem do laudo com compressão JPEG
      pdf.addImage(imgData, 'JPEG', imgX, imgY, finalWidth, finalHeight);
      
      // Adicionar informações da assinatura digital se existir (fora da área principal)
      if (assinaturaDigitalData) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.text(`Assinatura Digital: ${assinaturaDigitalData.id}`, 15, pageHeight - 25);
        pdf.text(`Algoritmo: ${assinaturaDigitalData.algoritmoassinatura}`, 15, pageHeight - 20);
        pdf.text(`Data: ${new Date(assinaturaDigitalData.timestamp).toLocaleString('pt-BR')}`, 15, pageHeight - 15);
        pdf.text(`Certificado: ${assinaturaDigitalData.certificado.nome}`, 15, pageHeight - 10);
      }
      
      // Nome do arquivo
      const fileName = `Laudo_${laudoEncontrado?.paciente?.nome?.replace(/\s+/g, '_')}_${laudoEncontrado?.paciente?.numero_laudo}_${new Date().toISOString().split('T')[0]}${assinaturaDigitalData ? '_ASSINADO' : ''}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss();
      toast.success(`✅ PDF do laudo gerado com sucesso! ${assinaturaDigitalData ? '(Com assinatura digital)' : ''}`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.dismiss();
      toast.error('❌ Erro ao gerar PDF do laudo');
    }
  };

  const handleGerarPDFDeclaracao = async () => {
    if (!declaracaoRef.current) {
      toast.error('Elemento de declaração não encontrado');
      return;
    }

    try {
      toast.loading('Gerando PDF da declaração...');
      
      // Criar um elemento temporário apenas com o conteúdo da declaração
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      tempDiv.style.width = '210mm'; // A4 width
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '20mm';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      tempDiv.style.color = '#000000';
      
      // Clonar apenas o conteúdo interno da declaração
      const declaracaoContent = declaracaoRef.current.cloneNode(true) as HTMLElement;
      
      // Remover elementos com classe no-print do clone
      const noPrintElements = declaracaoContent.querySelectorAll('.no-print');
      noPrintElements.forEach(el => el.remove());
      
      // Adicionar o conteúdo clonado ao elemento temporário
      tempDiv.appendChild(declaracaoContent);
      document.body.appendChild(tempDiv);
      
      // Capturar apenas o elemento temporário com escala reduzida
      const canvas = await html2canvas(tempDiv, {
        scale: 1.5, // Reduzido de 2 para 1.5 (reduz tamanho em ~44%)
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: tempDiv.scrollWidth,
        height: tempDiv.scrollHeight
      });

      // Remover o elemento temporário
      document.body.removeChild(tempDiv);

      // Usar JPEG com compressão (menor que PNG)
      const imgData = canvas.toDataURL('image/jpeg', 0.85); // Qualidade 85% (reduz tamanho significativamente)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calcular dimensões da imagem
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calcular proporção para ajustar ao PDF
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      // Centralizar a imagem no PDF
      const imgX = (pdfWidth - finalWidth) / 2;
      const imgY = 10;

      // Adicionar a imagem da declaração com compressão JPEG
      pdf.addImage(imgData, 'JPEG', imgX, imgY, finalWidth, finalHeight);
      
      // Adicionar informações da assinatura digital se existir (fora da área principal)
      if (assinaturaDigitalData) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 100, 100);
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.text(`Assinatura Digital: ${assinaturaDigitalData.id}`, 15, pageHeight - 25);
        pdf.text(`Algoritmo: ${assinaturaDigitalData.algoritmoassinatura}`, 15, pageHeight - 20);
        pdf.text(`Data: ${new Date(assinaturaDigitalData.timestamp).toLocaleString('pt-BR')}`, 15, pageHeight - 15);
        pdf.text(`Certificado: ${assinaturaDigitalData.certificado.nome}`, 15, pageHeight - 10);
      }
      
      // Nome do arquivo
      const fileName = `Declaracao_${dadosDeclaracao?.paciente?.nome?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}${assinaturaDigitalData ? '_ASSINADA' : ''}.pdf`;
      pdf.save(fileName);
      
      toast.dismiss();
      toast.success(`✅ PDF da declaração gerado com sucesso! ${assinaturaDigitalData ? '(Com assinatura digital)' : ''}`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.dismiss();
      toast.error('❌ Erro ao gerar PDF da declaração');
    }
  };

  // Função para enviar declaração por e-mail
  const handleEnviarEmailDeclaracao = async () => {
    if (!dadosDeclaracao) {
      toast.error('Nenhuma declaração para enviar');
      return;
    }

    const email = dadosDeclaracao.paciente?.email;
    if (!email) {
      toast.error('Paciente não possui e-mail cadastrado');
      return;
    }

    try {
      toast.loading('Preparando e-mail...');
      
      // Gerar PDF primeiro
      await handleGerarPDFDeclaracao();
      
      // Aqui você pode implementar uma chamada ao backend para enviar o e-mail
      // Por enquanto, vamos abrir o cliente de e-mail padrão
      const assunto = `Declaração de Comparecimento - ${dadosDeclaracao.paciente.nome}`;
      const corpo = `Prezado(a) ${dadosDeclaracao.paciente.nome},\n\nSegue em anexo sua declaração de comparecimento.\n\nAtenciosamente,\n${configuracoes?.nome_clinica || 'Clínica'}`;
      
      const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
      window.open(mailtoLink);
      
      toast.dismiss();
      toast.success(`✉️ Cliente de e-mail aberto para ${email}`);
    } catch (error) {
      console.error('Erro ao preparar e-mail:', error);
      toast.dismiss();
      toast.error('❌ Erro ao preparar e-mail');
    }
  };

  // Função para enviar declaração por WhatsApp
  const handleEnviarWhatsAppDeclaracao = () => {
    if (!dadosDeclaracao) {
      toast.error('Nenhuma declaração para enviar');
      return;
    }

    const telefone = dadosDeclaracao.paciente?.telefone;
    if (!telefone) {
      toast.error('Paciente não possui telefone cadastrado');
      return;
    }

    try {
      // Limpar telefone (remover caracteres não numéricos)
      const telefoneLimpo = telefone.replace(/\D/g, '');
      
      // Preparar mensagem
      const mensagem = `Olá ${dadosDeclaracao.paciente.nome}! 

Sua declaração de comparecimento está pronta.

📅 Data de comparecimento: ${dadosDeclaracao.agendamento ? formatDateToBrazilian(dadosDeclaracao.agendamento.data_agendamento) : 'Data não disponível'}

Para baixar o documento, acesse o link que será enviado por e-mail ou solicite ao atendimento.

Atenciosamente,
${configuracoes?.nome_clinica || 'Clínica'}`;

      // Abrir WhatsApp Web
      const whatsappLink = `https://wa.me/55${telefoneLimpo}?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappLink, '_blank');
      
      toast.success(`✅ WhatsApp aberto para ${telefone}`);
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      toast.error('❌ Erro ao abrir WhatsApp');
    }
  };

  // Funções para assinatura digital
  const carregarCertificados = async () => {
    try {
      setCarregandoCertificados(true);
      toast.loading('🔍 Detectando token A3 no seu computador...');
      
      // Verificar se o componente Web PKI está instalado
      const instalado = await webPkiService.verificarInstalacao();
      
      if (!instalado) {
        toast.error('❌ Componente Web PKI não instalado');
        toast('📥 Baixe em: https://get.webpkiplugin.com/', { duration: 8000, icon: 'ℹ️' });
        return;
      }
      
      // Listar certificados do token A3 (no computador do usuário)
      const certificados = await webPkiService.listarCertificados();
      
      if (certificados && certificados.length > 0) {
        setCertificadosDisponiveis(certificados);
        toast.success(`✅ Token A3 detectado! ${certificados.length} certificado(s) encontrado(s)`);
      } else {
        toast.error('❌ Nenhum certificado encontrado. Conecte o token A3.');
      }
      
    } catch (error: any) {
      console.error('Erro ao carregar certificados:', error);
      
      if (error.message && error.message.includes('COMPONENTE_NAO_INSTALADO')) {
        toast.error('❌ Componente Web PKI não instalado');
        toast('📥 Instale em: https://get.webpkiplugin.com/', { duration: 8000, icon: 'ℹ️' });
      } else if (error.message && error.message.includes('token')) {
        toast.error('❌ Token A3 não detectado. Conecte o token na porta USB.');
      } else {
        toast.error('❌ Erro ao acessar certificados digitais');
      }
    } finally {
      setCarregandoCertificados(false);
    }
  };

  const validarCertificado = async (certificadoId: string) => {
    try {
      // Com Web PKI, a validação é feita automaticamente ao listar
      // Certificados listados já são válidos
      const cert = certificadosDisponiveis.find(c => c.id === certificadoId);
      
      if (cert) {
        toast.success('✅ Certificado válido e dentro da validade');
        return cert;
      } else {
        toast.error('Certificado não encontrado');
        return null;
      }
    } catch (error) {
      console.error('Erro ao validar certificado:', error);
      toast.error('Erro ao validar certificado');
      return null;
    }
  };

  const assinarDocumentoDigitalmente = async () => {
    if (!certificadoSelecionado) {
      toast.error('Selecione um certificado');
      return;
    }

    // Verificar se há documento para assinar (laudo ou declaração)
    if (!laudoEncontrado && !dadosDeclaracao) {
      toast.error('Nenhum documento para assinar');
      return;
    }

    // Web PKI solicita PIN automaticamente - não precisa de modal
    // Chamar diretamente a função de assinatura
    await confirmarAssinaturaComPin();
  };

  const confirmarAssinaturaComPin = async () => {
    // Web PKI solicita o PIN automaticamente via diálogo do token
    // Não precisamos do modal de PIN
    setMostrarModalPin(false);

    try {
      setAssinandoDigitalmente(true);
      toast.loading('🔐 Assinando documento com token A3...');
      toast.loading('⚠️ O sistema vai solicitar o PIN do token...', { duration: 3000 });

      // Determinar tipo de documento e dados
      const tipoDocumento = laudoEncontrado ? 'laudo' : 'declaracao';
      const dadosDocumento = laudoEncontrado || dadosDeclaracao;
      
      // Gerar hash do documento (SHA-256)
      const documentoTexto = JSON.stringify(dadosDocumento);
      const encoder = new TextEncoder();
      const data = encoder.encode(documentoTexto);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const documentoHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      console.log('📄 Hash do documento gerado:', documentoHash.substring(0, 20) + '...');

      // Buscar certificado selecionado
      const certSelecionado = certificadosDisponiveis.find(c => c.id === certificadoSelecionado);
      
      if (!certSelecionado) {
        toast.error('Certificado não encontrado');
        return;
      }

      // Assinar com Web PKI (solicita PIN automaticamente)
      console.log('✍️ Chamando Web PKI para assinar...');
      const resultado = await webPkiService.assinarDocumento(
        certSelecionado.thumbprint || certSelecionado.id,
        documentoHash
      );

      if (resultado.success) {
        const assinaturaDigital = {
          id: `sig-${Date.now()}`,
          certificadoId: certSelecionado.id,
          documentoHash,
          algoritmoassinatura: resultado.algoritmo,
          timestamp: resultado.timestamp,
          assinatura: resultado.assinatura,
          certificado: {
            nome: certSelecionado.nome,
            cpf: certSelecionado.cpf,
            validade: certSelecionado.validade
          }
        };

        setAssinaturaDigitalData(assinaturaDigital);
        toast.success('✅ Documento assinado digitalmente com sucesso!');
        toast.success('🔐 Assinatura criptográfica válida (ICP-Brasil)', { duration: 5000 });
        
        // Limpar estados
        setPinCertificado('');
        setTentativasPin(0);
      } else {
        toast.error('Erro ao assinar documento');
      }
      
    } catch (error: any) {
      console.error('❌ Erro ao assinar documento:', error);
      
      if (error.message && error.message.includes('PIN')) {
        toast.error('❌ PIN incorreto ou cancelado pelo usuário');
        toast('⚠️ Verifique o PIN do seu token A3', { duration: 5000, icon: '🔐' });
      } else if (error.message && error.message.includes('cancelado')) {
        toast.error('ℹ️ Assinatura cancelada pelo usuário');
      } else {
        toast.error('❌ Erro ao assinar documento digitalmente');
      }
    } finally {
      setAssinandoDigitalmente(false);
    }
  };


  const handleBuscarDeclaracao = async () => {
    if (!buscaDeclaracao.trim()) {
      toast.error('Digite CPF ou nome do paciente');
      return;
    }

    setBuscandoDeclaracao(true);
    try {
      // Buscar paciente por CPF ou nome
      const response = await pacientesService.list({ 
        search: buscaDeclaracao,
        limit: 100 
      });
      
      const pacientes = (response as any)?.data?.data?.pacientes || [];
      
      if (pacientes.length === 0) {
        toast.error('Nenhum paciente encontrado');
        setDadosDeclaracao(null);
        return;
      }

      const paciente = pacientes[0];
      
      // Buscar agendamento do paciente - tentar por CPF sem formatação primeiro
      const cpfLimpo = paciente.cpf ? paciente.cpf.replace(/\D/g, '') : '';
      
      console.log('🔍 Buscando agendamento para:', {
        nome: paciente.nome,
        cpf: paciente.cpf,
        cpfLimpo: cpfLimpo
      });
      
      // Tentar buscar por CPF limpo primeiro, depois por nome
      let agendamentosResponse = await agendamentosService.list({
        search: cpfLimpo,
        limit: 10
      });
      
      let agendamentos = (agendamentosResponse as any)?.data?.data?.agendamentos || [];
      
      // Se não encontrou por CPF, tentar por nome
      if (agendamentos.length === 0 && paciente.nome) {
        console.log('⚠️ Não encontrou por CPF, tentando por nome...');
        agendamentosResponse = await agendamentosService.list({
          search: paciente.nome,
          limit: 10
        });
        agendamentos = (agendamentosResponse as any)?.data?.data?.agendamentos || [];
      }
      
      console.log('📋 Total de agendamentos encontrados:', agendamentos.length);
      
      // Pegar o agendamento mais recente
      const agendamento = agendamentos.length > 0 ? agendamentos[0] : null;
      
      if (agendamento) {
        console.log('✅ Agendamento encontrado:', {
          id: agendamento.id,
          nome: agendamento.nome,
          cpf: agendamento.cpf,
          data_agendamento: agendamento.data_agendamento
        });
        console.log('📅 Data do agendamento (raw):', agendamento.data_agendamento);
        console.log('🕐 Tipo da data:', typeof agendamento.data_agendamento);
        
        if (agendamento.data_agendamento) {
          const data = new Date(agendamento.data_agendamento);
          console.log('⏰ Data parseada:', data);
          console.log('⏰ Data ISO:', data.toISOString());
          console.log('⏰ Hora:', data.getHours(), 'Minuto:', data.getMinutes());
          console.log('⏰ UTC Hora:', data.getUTCHours(), 'UTC Minuto:', data.getUTCMinutes());
        }
      } else {
        console.warn('❌ Nenhum agendamento encontrado para este paciente');
      }
      
      setDadosDeclaracao({
        paciente: paciente,
        agendamento: agendamento,
        psicologo: currentUser
      });
      
      toast.success('Dados carregados para declaração!');
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao buscar dados');
      setDadosDeclaracao(null);
    } finally {
      setBuscandoDeclaracao(false);
    }
  };

  const handleBuscarLaudo = async () => {
    if (!buscaLaudo.trim()) {
      toast.error('Digite um número de laudo, CPF ou nome para buscar');
      return;
    }

    setBuscandoLaudo(true);
    try {
      // Buscar paciente por laudo, CPF ou nome
      const response = await pacientesService.list({ 
        search: buscaLaudo,
        limit: 100 
      });
      
      const pacientes = (response as any)?.data?.data?.pacientes || [];
      
      if (pacientes.length === 0) {
        toast.error('Nenhum paciente encontrado com estes dados');
        setLaudoEncontrado(null);
        return;
      }

      // Se encontrou múltiplos, pegar o primeiro que tem laudo
      const pacienteComLaudo = pacientes.find((p: any) => p.numero_laudo) || pacientes[0];
      
      if (!pacienteComLaudo.numero_laudo) {
        toast.error('Este paciente não possui número de laudo definido');
        setLaudoEncontrado(null);
        return;
      }

      // Buscar avaliações do paciente
      const avaliacoesResponse = await avaliacoesService.list({ 
        paciente_id: pacienteComLaudo.id,
        limit: 100
      });
      
      const avaliacoes = (avaliacoesResponse as any)?.data?.data?.avaliacoes || [];
      const avaliacoesDoLaudo = avaliacoes.filter((av: any) => av.numero_laudo === pacienteComLaudo.numero_laudo);
      
      // Buscar testes de cada avaliação
      const testesPromises = avaliacoesDoLaudo.map(async (av: any) => {
        try {
          const testesResponse = await avaliacoesService.getTestes(av.id);
          return (testesResponse as any)?.data?.data?.testes || [];
        } catch (error) {
          console.error('Erro ao buscar testes da avaliação:', av.id, error);
          return [];
        }
      });
      
      const testesArrays = await Promise.all(testesPromises);
      const todosTestes = testesArrays.flat();
      
      setLaudoEncontrado({
        paciente: pacienteComLaudo,
        avaliacoes: avaliacoesDoLaudo,
        testes: todosTestes,
        aptidao: avaliacoesDoLaudo.find((av: any) => av.aptidao)?.aptidao || null,
        psicologo: currentUser
      });
      
      toast.success(`Laudo ${pacienteComLaudo.numero_laudo} carregado com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao buscar laudo:', error);
      toast.error('Erro ao buscar laudo');
      setLaudoEncontrado(null);
    } finally {
      setBuscandoLaudo(false);
    }
  };

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Laudos</h1>
          <p className="text-gray-600">Gere laudos e visualize estatísticas</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('laudos')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'laudos'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📄 Laudos
            </button>
            <button
              onClick={() => setActiveTab('declaracao')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'declaracao'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📋 Declaração
            </button>
            <button
              onClick={() => setActiveTab('estatisticas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'estatisticas'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Estatísticas
            </button>
          </nav>
        </div>

        {/* TAB: LAUDOS */}
        {activeTab === 'laudos' && (
          <div className="space-y-6">
            {/* Busca de Laudo */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Buscar Laudo</h3>
              <p className="text-sm text-gray-600 mb-4">
                Digite o número do laudo, CPF ou nome do paciente para carregar os dados e gerar o laudo
              </p>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={buscaLaudo}
                  onChange={(e) => setBuscaLaudo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscarLaudo()}
                  placeholder="Número do laudo, CPF ou nome do paciente..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleBuscarLaudo}
                  disabled={buscandoLaudo}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {buscandoLaudo ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Buscar
                    </>
                  )}
                </button>
              </div>
              
              <p className="text-xs text-gray-500 mt-3">
                💡 Você pode buscar por número completo (LAU-2025-0001), apenas os 4 dígitos (0001), CPF ou nome do paciente
              </p>
            </div>

            {/* Laudo Completo */}
            {laudoEncontrado && (
              <div className="bg-white border-2 border-blue-300 rounded-lg p-8 laudo-impressao">
                {/* Cabeçalho com Botões de Ação */}
                <div className="flex justify-between items-start mb-6 no-print">
                  <h3 className="text-2xl font-bold text-gray-900">📋 Laudo Psicológico</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGerarPDFLaudo}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Baixar PDF
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Imprimir
                    </button>
                  </div>
                </div>

                {/* Conteúdo do Laudo para PDF */}
                <div ref={laudoRef} className="space-y-6 text-gray-800">
                  {/* 1. Identificação */}
                  <section>
                    <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-300 pb-2">1. IDENTIFICAÇÃO</h4>
                    <div className="space-y-2 ml-4">
                      <p><strong>Nome do avaliado:</strong> {laudoEncontrado.paciente.nome}</p>
                      <p><strong>Documento (CPF):</strong> {laudoEncontrado.paciente.cpf}</p>
                      <p>
                        <strong>Data de nascimento:</strong> {laudoEncontrado.paciente.data_nascimento ? formatDateToBrazilian(laudoEncontrado.paciente.data_nascimento) : '-'} | 
                        <strong> Idade:</strong> {laudoEncontrado.paciente.data_nascimento ? `${calculateAge(laudoEncontrado.paciente.data_nascimento)} anos` : '-'}
                      </p>
                      <p><strong>Número do processo/registro:</strong> {laudoEncontrado.paciente.numero_laudo}</p>
                      <p><strong>Data(s) da avaliação:</strong> {(() => {
                        // Extrair datas únicas dos testes aplicados
                        const datasTestes = laudoEncontrado.testes
                          .map((teste: any) => teste.created_at || teste.data_aplicacao)
                          .filter((data: any) => data)
                          .map((data: any) => new Date(data).toISOString().split('T')[0])
                          .filter((data: string, index: number, array: string[]) => array.indexOf(data) === index)
                          .sort()
                          .map((data: string) => formatDateToBrazilian(data));
                        
                        // Se não há datas dos testes, usar data_aplicacao das avaliações
                        if (datasTestes.length === 0) {
                          const datasAvaliacoes = laudoEncontrado.avaliacoes
                            .map((av: any) => av.data_aplicacao)
                            .filter((data: any) => data)
                            .map((data: any) => new Date(data).toISOString().split('T')[0])
                            .filter((data: string, index: number, array: string[]) => array.indexOf(data) === index)
                            .sort()
                            .map((data: string) => formatDateToBrazilian(data));
                          
                          return datasAvaliacoes.length > 0 ? datasAvaliacoes.join(', ') : 'Data não disponível';
                        }
                        
                        return datasTestes.join(', ');
                      })()}</p>
                      <p><strong>Local da avaliação:</strong> {configuracoes?.nome_clinica || '[Clínica não configurada]'}{configuracoes?.endereco ? ` - ${configuracoes.endereco}` : ''}</p>
                    </div>
                  </section>

                  {/* 2. Demanda e Objetivo */}
                  <section>
                    <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-300 pb-2">2. DEMANDA E OBJETIVO</h4>
                    <div className="space-y-2 ml-4">
                      <p><strong>Demanda:</strong> Avaliação psicológica para fins de {laudoEncontrado.paciente.tipo_transito?.toLowerCase() || 'obtenção/renovação'} da Carteira Nacional de Habilitação (CNH) no Estado de São Paulo.</p>
                      <p><strong>Objetivo:</strong> Investigar condições psicológicas relevantes para direção veicular, com foco em memória, atenção, raciocínio lógico, personalidade e entrevista psicológica, conforme normas aplicáveis ao contexto do trânsito.</p>
                    </div>
                  </section>

                  {/* 4. Procedimentos e Instrumentos */}
                  <section>
                    <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-300 pb-2">4. PROCEDIMENTOS, INSTRUMENTOS E CONDIÇÕES DE AVALIAÇÃO</h4>
                    <div className="space-y-3 ml-4">
                      <div>
                        <p className="font-semibold mb-2">Procedimentos:</p>
                        <ul className="list-disc ml-6 space-y-1">
                          <li>Entrevista psicológica estruturada/semi estruturada</li>
                          <li>Aplicação de testes psicológicos padronizados e validados para a população-alvo</li>
                          <li>Observação comportamental durante a avaliação</li>
                        </ul>
                      </div>
                      
                      <div>
                        <p className="font-semibold mb-2">Instrumentos utilizados (todos com parecer favorável no SATEPSI):</p>
                        <ul className="list-disc ml-6 space-y-1">
                          {laudoEncontrado.testes.map((teste: any, idx: number) => {
                            // Para Rotas, precisamos extrair as classificações de cada rota
                            if (teste.tipo === 'rotas' && Array.isArray(teste.resultado)) {
                              return teste.resultado.map((rota: any, rotaIdx: number) => (
                                <li key={`${idx}-${rotaIdx}`}>
                                  <strong>{teste.nome} - {rota.rota_tipo}</strong> - Classificação: {rota.classificacao || 'N/A'}
                                </li>
                              ));
                            }
                            // Para outros testes
                            return (
                              <li key={idx}>
                                <strong>{teste.nome}</strong> - Classificação: {teste.resultado?.classificacao || 'N/A'}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  </section>

                  {/* 7. Conclusão Técnica */}
                  <section>
                    <h4 className="font-bold text-lg mb-3 border-b-2 border-gray-300 pb-2">7. CONCLUSÃO TÉCNICA</h4>
                    <div className="space-y-3 ml-4">
                      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                        <p className="font-bold text-lg">
                          Parecer: {' '}
                          {laudoEncontrado.aptidao === 'Apto' && '✅ APTO psicologicamente para condução veicular no contexto do trânsito (DETRAN/SP)'}
                          {laudoEncontrado.aptidao === 'Inapto Temporário' && '⚠️ INAPTO TEMPORÁRIO'}
                          {laudoEncontrado.aptidao === 'Inapto' && '❌ INAPTO psicologicamente para condução veicular'}
                          {!laudoEncontrado.aptidao && '⏳ Avaliação inconclusiva – necessário retorno/reavaliação'}
                        </p>
                      </div>
                      <p><strong>Validade:</strong> 6 meses a contar da data de emissão.</p>
                      <p><strong>Escopo:</strong> Uso exclusivo no contexto do trânsito. Este laudo não é válido para outras áreas ou finalidades.</p>
                      <div className="mt-6 pt-6 border-t-2 border-gray-300">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <p><strong>Nome do(a) psicólogo(a):</strong> {laudoEncontrado.psicologo?.nome || currentUser?.nome}</p>
                            <p className="mt-2"><strong>CRP:</strong> {laudoEncontrado.psicologo?.crp || (currentUser as any)?.crp || '[CRP não informado]'}</p>
                            <p className="mt-2"><strong>Local e data:</strong> {configuracoes?.cidade || 'São Paulo'}/SP, {new Date().toLocaleDateString('pt-BR')}</p>
                          </div>
                          
                          <div>
                            <p className="font-semibold mb-2">Assinatura e Carimbo:</p>
                            {assinaturaDigitalData ? (
                              <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                                <div className="text-center">
                                  <div className="text-green-800 font-semibold mb-2 flex items-center justify-center gap-2">
                                    ✅ ASSINADO DIGITALMENTE
                                  </div>
                                  <div className="text-sm text-green-700">
                                    <p><strong>Psicólogo:</strong> {assinaturaDigitalData.certificado.nome}</p>
                                    <p><strong>CRP:</strong> {laudoEncontrado.psicologo?.crp || (currentUser as any)?.crp || '[CRP não informado]'}</p>
                                    <p><strong>Data:</strong> {new Date(assinaturaDigitalData.timestamp).toLocaleDateString('pt-BR')}</p>
                                    <p><strong>Certificado:</strong> {assinaturaDigitalData.certificado.cpf}</p>
                                  </div>
                                </div>
                              </div>
                            ) : assinaturaImagem ? (
                              <div className="border-2 border-gray-300 rounded-lg p-2 bg-white">
                                <img src={assinaturaImagem} alt="Assinatura" className="h-24 object-contain mx-auto" />
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
                                <p className="text-sm text-gray-500">__________________________</p>
                                <p className="text-xs text-gray-400 mt-2">(Assinatura e carimbo)</p>
                              </div>
                            )}
                            <label className="mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all cursor-pointer text-sm no-print">
                              <Upload className="w-4 h-4" />
                              {assinaturaImagem ? 'Trocar Assinatura' : 'Adicionar Assinatura'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAssinaturaUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Assinatura Digital para Laudos */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 no-print">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🔐 Assinatura Digital com e-CPF
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Carregar Certificados */}
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={carregarCertificados}
                        disabled={carregandoCertificados}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Search className="w-4 h-4" />
                        {carregandoCertificados ? 'Carregando...' : 'Carregar Certificados'}
                      </button>
                      
                      {certificadosDisponiveis.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {certificadosDisponiveis.length} certificado(s) encontrado(s)
                        </span>
                      )}
                    </div>

                    {/* Seleção de Certificado */}
                    {certificadosDisponiveis.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecione o Certificado:
                        </label>
                        <select
                          value={certificadoSelecionado}
                          onChange={(e) => setCertificadoSelecionado(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Escolha um certificado...</option>
                          {certificadosDisponiveis.map((cert) => (
                            <option key={cert.id} value={cert.id}>
                              {cert.nome} - {cert.cpf} (Válido até: {cert.validade})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Informações do Certificado Selecionado */}
                    {certificadoSelecionado && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        {(() => {
                          const cert = certificadosDisponiveis.find(c => c.id === certificadoSelecionado);
                          return cert ? (
                            <div>
                              <h4 className="font-semibold text-blue-800">Certificado Selecionado:</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                <strong>Nome:</strong> {cert.nome}
                              </p>
                              <p className="text-sm text-blue-700">
                                <strong>CPF:</strong> {cert.cpf}
                              </p>
                              <p className="text-sm text-blue-700">
                                <strong>Tipo:</strong> {cert.tipo}
                              </p>
                              <p className="text-sm text-blue-700">
                                <strong>Validade:</strong> {cert.validade}
                              </p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Botão de Assinatura Digital */}
                    {certificadoSelecionado && (
                      <div className="flex gap-3">
                        <button
                          onClick={assinarDocumentoDigitalmente}
                          disabled={assinandoDigitalmente}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 font-semibold"
                        >
                          <FileText className="w-5 h-5" />
                          {assinandoDigitalmente ? 'Assinando...' : '🔐 Assinar Digitalmente'}
                        </button>
                        
                        <button
                          onClick={() => validarCertificado(certificadoSelecionado)}
                          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Validar Certificado
                        </button>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

            {!laudoEncontrado && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhum laudo carregado</p>
                <p className="text-gray-500 text-sm mt-2">Use o campo de busca acima para encontrar um laudo</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: DECLARAÇÃO */}
        {activeTab === 'declaracao' && (
          <div className="space-y-6">
            {/* Busca de Paciente */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 no-print">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🔍 Buscar Paciente</h3>
              <p className="text-sm text-gray-600 mb-4">
                Digite o CPF ou nome do paciente para gerar a declaração de comparecimento
              </p>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={buscaDeclaracao}
                  onChange={(e) => setBuscaDeclaracao(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBuscarDeclaracao()}
                  placeholder="CPF ou nome do paciente..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={handleBuscarDeclaracao}
                  disabled={buscandoDeclaracao}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {buscandoDeclaracao ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Buscar
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Declaração Completa */}
            {dadosDeclaracao && (
              <div className="bg-white border-2 border-green-300 rounded-lg p-12">
                {/* Botões de Ação */}
                <div className="flex justify-end gap-3 mb-6 no-print">
                  <button
                    onClick={handleEnviarEmailDeclaracao}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Enviar por E-mail
                  </button>
                  <button
                    onClick={handleEnviarWhatsAppDeclaracao}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Enviar por WhatsApp
                  </button>
                  <button
                    onClick={handleGerarPDFDeclaracao}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Imprimir
                  </button>
                </div>

                {/* Seção de Assinatura Digital */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 no-print">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    🔐 Assinatura Digital com e-CPF
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Carregar Certificados */}
                    <div className="flex gap-3 items-center">
                      <button
                        onClick={carregarCertificados}
                        disabled={carregandoCertificados}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        <Search className="w-4 h-4" />
                        {carregandoCertificados ? 'Carregando...' : 'Carregar Certificados'}
                      </button>
                      
                      {certificadosDisponiveis.length > 0 && (
                        <span className="text-sm text-gray-600">
                          {certificadosDisponiveis.length} certificado(s) encontrado(s)
                        </span>
                      )}
                    </div>

                    {/* Seleção de Certificado */}
                    {certificadosDisponiveis.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selecione o Certificado:
                        </label>
                        <select
                          value={certificadoSelecionado}
                          onChange={(e) => setCertificadoSelecionado(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="">Escolha um certificado...</option>
                          {certificadosDisponiveis.map((cert) => (
                            <option key={cert.id} value={cert.id}>
                              {cert.nome} - {cert.cpf} (Válido até: {cert.validade})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Informações do Certificado Selecionado */}
                    {certificadoSelecionado && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        {(() => {
                          const cert = certificadosDisponiveis.find(c => c.id === certificadoSelecionado);
                          return cert ? (
                            <div>
                              <h4 className="font-semibold text-blue-800">Certificado Selecionado:</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                <strong>Nome:</strong> {cert.nome}
                              </p>
                              <p className="text-sm text-blue-700">
                                <strong>CPF:</strong> {cert.cpf}
                              </p>
                              <p className="text-sm text-blue-700">
                                <strong>Tipo:</strong> {cert.tipo}
                              </p>
                              <p className="text-sm text-blue-700">
                                <strong>Validade:</strong> {cert.validade}
                              </p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* Botão de Assinatura Digital */}
                    {certificadoSelecionado && (
                      <div className="flex gap-3">
                        <button
                          onClick={assinarDocumentoDigitalmente}
                          disabled={assinandoDigitalmente}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 font-semibold"
                        >
                          <FileText className="w-5 h-5" />
                          {assinandoDigitalmente ? 'Assinando...' : '🔐 Assinar Digitalmente'}
                        </button>
                        
                        <button
                          onClick={() => validarCertificado(certificadoSelecionado)}
                          className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
                        >
                          <Search className="w-4 h-4" />
                          Validar Certificado
                        </button>
                      </div>
                    )}

                  </div>
                </div>
                
                {/* Conteúdo da Declaração para PDF */}
                <div ref={declaracaoRef} className="declaracao-impressao bg-white p-12">
                {/* Cabeçalho */}
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-gray-900">{configuracoes?.nome_clinica || 'Clínica Psicotran Sanchez'}</h2>
                  <p className="text-sm text-gray-700">Avaliação Psicológica</p>
                  <p className="text-sm text-gray-700">
                    {configuracoes?.endereco || 'Rua Antônio Macedo Nº 128'} – CEP {configuracoes?.cep || '03080-010'}
                  </p>
                  <p className="text-sm text-gray-700">{configuracoes?.cidade || 'São Paulo'}</p>
                </div>

                {/* Título */}
                <h3 className="text-center text-2xl font-bold text-gray-900 mb-8">DECLARAÇÃO</h3>

                {/* Conteúdo */}
                <div className="space-y-6 text-gray-800 leading-relaxed text-justify">
                  <p>
                    Eu, <strong className="uppercase">{dadosDeclaracao.psicologo?.nome || currentUser?.nome}</strong>, 
                    Psicólogo(a), inscrito(a) no CRP/SP sob o n° <strong>{dadosDeclaracao.psicologo?.crp || (currentUser as any)?.crp || '06/127348'}</strong>, 
                    DECLARO para os devidos fins que o(a) Sr(a). <strong className="uppercase">{dadosDeclaracao.paciente.nome}</strong>, 
                    inscrito(a) no CPF sob o Nº <strong>{dadosDeclaracao.paciente.cpf}</strong>, 
                    compareceu à {configuracoes?.nome_clinica || 'Clínica Psicotran Sanchez'} para realização de avaliação psicológica 
                    para obtenção da CNH, no dia{' '}
                    <strong>
                      {dadosDeclaracao.agendamento?.data_agendamento ? 
                        formatDateToBrazilian(dadosDeclaracao.agendamento.data_agendamento) : 
                        '____/____/________'}
                    </strong>, no período das{' '}
                    <strong>
                      {dadosDeclaracao.agendamento?.data_agendamento ? (() => {
                        console.log('🖨️ Renderizando horário na declaração...');
                        console.log('🖨️ Data raw:', dadosDeclaracao.agendamento.data_agendamento);
                        
                        const data = new Date(dadosDeclaracao.agendamento.data_agendamento);
                        console.log('🖨️ Data parseada:', data);
                        console.log('🖨️ getHours():', data.getHours(), 'getMinutes():', data.getMinutes());
                        console.log('🖨️ getUTCHours():', data.getUTCHours(), 'getUTCMinutes():', data.getUTCMinutes());
                        
                        const horaInicio = String(data.getHours()).padStart(2, '0') + ':' + String(data.getMinutes()).padStart(2, '0');
                        const dataFim = new Date(data.getTime() + 2 * 60 * 60 * 1000);
                        const horaFim = String(dataFim.getHours()).padStart(2, '0') + ':' + String(dataFim.getMinutes()).padStart(2, '0');
                        
                        const resultado = `${horaInicio} às ${horaFim} hs`;
                        console.log('🖨️ Resultado final:', resultado);
                        
                        return resultado;
                      })() : '________ às ________ hs'}
                    </strong>.
                  </p>

                  <p className="border-t border-dashed border-gray-300 pt-4"></p>

                  <p>
                    Por ser verdade, firmo o presente para que surta seus efeitos legais.
                  </p>

                  <p className="border-t border-dashed border-gray-300 pt-4"></p>

                  <p className="mt-8">
                    <strong>{configuracoes?.cidade || 'São Paulo'}, {new Date().toLocaleDateString('pt-BR')}</strong>.
                  </p>

                  {/* Área de Assinatura */}
                  <div className="mt-16 pt-8 border-t-2 border-gray-300">
                    <div className="flex justify-center">
                      {assinaturaImagem ? (
                        <div>
                          <img 
                            src={assinaturaImagem} 
                            alt="Assinatura" 
                            className="h-24 object-contain mx-auto mb-2" 
                            onError={(e) => {
                              console.error('Erro ao carregar assinatura:', e);
                              toast.error('Erro ao exibir assinatura. Verifique o arquivo.');
                              setAssinaturaImagem(null);
                            }}
                          />
                          <div className="border-t-2 border-gray-800 w-64 mx-auto"></div>
                        </div>
                      ) : assinaturaDigitalData ? (
                        <div className="w-80 text-center">
                          <div className="border-2 border-green-300 rounded-lg p-4 bg-green-50">
                            <div className="text-green-800 font-semibold mb-2 flex items-center justify-center gap-2">
                              ✅ ASSINADO DIGITALMENTE
                            </div>
                            <div className="text-sm text-green-700">
                              <p><strong>Psicólogo:</strong> {assinaturaDigitalData.certificado.nome}</p>
                              <p><strong>CRP:</strong> {dadosDeclaracao.psicologo?.crp || (currentUser as any)?.crp || '[CRP não informado]'}</p>
                              <p><strong>Data:</strong> {new Date(assinaturaDigitalData.timestamp).toLocaleDateString('pt-BR')}</p>
                              <p><strong>Certificado:</strong> {assinaturaDigitalData.certificado.cpf}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-64 text-center">
                          <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                            [Área para assinatura]
                          </div>
                          <div className="border-t-2 border-gray-800"></div>
                        </div>
                      )}
                    </div>
                    <p className="text-center mt-2 font-semibold">{dadosDeclaracao.psicologo?.nome || currentUser?.nome}</p>
                    <p className="text-center text-sm">Psicólogo(a) - CRP/SP {dadosDeclaracao.psicologo?.crp || (currentUser as any)?.crp || '06/127348'}</p>
                    
                    {/* Informações da Assinatura Digital */}
                    {assinaturaDigitalData && (
                      <div className="text-center mt-2 text-xs text-gray-500">
                        <p>Assinatura Digital: {assinaturaDigitalData.id}</p>
                        <p>Algoritmo: {assinaturaDigitalData.algoritmoassinatura}</p>
                        <p>Data: {new Date(assinaturaDigitalData.timestamp).toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                    
                    {/* Botão para adicionar assinatura */}
                    <div className="flex justify-center mt-4 no-print">
                      <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all cursor-pointer text-sm">
                        <Upload className="w-4 h-4" />
                        {assinaturaImagem ? 'Trocar Assinatura' : 'Adicionar Assinatura'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAssinaturaUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
                </div> {/* Fecha declaracaoRef */}
              </div>
            )}

            {!dadosDeclaracao && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Nenhuma declaração gerada</p>
                <p className="text-gray-500 text-sm mt-2">Use o campo de busca acima para encontrar um paciente</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: ESTATÍSTICAS */}
        {activeTab === 'estatisticas' && (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">Estatísticas em desenvolvimento...</p>
          </div>
        )}

        {/* Modal para solicitar PIN */}
        {mostrarModalPin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🔐 Certificado A3 - Inserir PIN
              </h3>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Certificado Selecionado:</h4>
                  {(() => {
                    const cert = certificadosDisponiveis.find(c => c.id === certificadoSelecionado);
                    return cert ? (
                      <div className="text-sm text-blue-700">
                        <p><strong>Nome:</strong> {cert.nome}</p>
                        <p><strong>CPF:</strong> {cert.cpf}</p>
                        <p><strong>Tipo:</strong> {cert.tipo}</p>
                      </div>
                    ) : null;
                  })()}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN do Certificado A3:
                  </label>
                  <input
                    type="password"
                    value={pinCertificado}
                    onChange={(e) => setPinCertificado(e.target.value)}
                    placeholder="Digite o PIN do seu certificado A3"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-center text-lg tracking-widest"
                    maxLength={8}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    🔒 O PIN é necessário para acessar a chave privada do certificado A3
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PINs de teste: 1234, 0000, 1111, 9999
                  </p>
                </div>

                {tentativasPin > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ PIN incorreto. Tentativas restantes: {3 - tentativasPin}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setMostrarModalPin(false);
                      setPinCertificado('');
                      setTentativasPin(0);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmarAssinaturaComPin}
                    disabled={assinandoDigitalmente}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {assinandoDigitalmente ? 'Assinando...' : '🔐 Assinar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
