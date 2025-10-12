'use client';

import React from 'react';
import Layout from '@/components/Layout';

export default function ConfiguracoesPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600">Configurar sistema e preferências</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Página de configurações em desenvolvimento...</p>
        </div>
      </div>
    </Layout>
  );
}
