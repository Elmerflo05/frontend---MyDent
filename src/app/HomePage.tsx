import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Calendar, TestTube, BarChart } from 'lucide-react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-clinic-primary/10 via-white to-laboratory-primary/10">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-clinic-primary rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Centro Odontológico Integral
            </h1>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link
              to="/login"
              className="px-6 py-2 bg-clinic-primary text-white rounded-lg hover:bg-clinic-primary/90 transition-colors"
            >
              Iniciar Sesión
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold text-gray-900 mb-6"
          >
            Sistema Integral de Gestión
            <span className="block text-clinic-primary">Odontológica y Laboratorial</span>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto"
          >
            Plataforma moderna que integra la gestión de clínica odontológica y laboratorio dental 
            con interfaces separadas para mantener la confidencialidad comercial.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-clinic-primary text-white rounded-xl hover:bg-clinic-primary/90 transition-all transform hover:scale-105 font-semibold"
            >
              Acceder al Sistema
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-clinic-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-clinic-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Portal Clínica</h3>
            <p className="text-gray-600">
              Gestión completa de pacientes, citas, historiales médicos y tratamientos
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-laboratory-primary/10 rounded-lg flex items-center justify-center mb-4">
              <TestTube className="w-6 h-6 text-laboratory-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Portal Laboratorio</h3>
            <p className="text-gray-600">
              Sistema independiente para gestión de muestras, análisis y resultados
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Gestión de Citas</h3>
            <p className="text-gray-600">
              Calendario inteligente con recordatorios automáticos y lista de espera
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Reportes y Analytics</h3>
            <p className="text-gray-600">
              Dashboards interactivos con métricas en tiempo real y reportes detallados
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-clinic-primary rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-semibold">Centro Odontológico Integral</span>
          </div>
          <p className="text-gray-400">
            Sistema integral de gestión odontológica y laboratorial
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;