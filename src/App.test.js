import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

// Un mic "mock" pentru grafice (Recharts), deoarece Jest nu are un ecran real să deseneze graficul
jest.mock('recharts', () => {
  const OriginalRechartsModule = jest.requireActual('recharts');
  return {
    ...OriginalRechartsModule,
    ResponsiveContainer: ({ children }) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

describe('Aplicația FleetGuard Pro - Teste CRUD & Gold Flow', () => {
  
  test('Flow complet: Login -> Prezentare -> Dashboard (Read)', () => {
    render(<App />);
    
    // 1. Verificăm că suntem pe ecranul de Login
    expect(screen.getByText(/Autentificare/i)).toBeInTheDocument();
    
    // 2. Facem click pe butonul de Login pentru a trece mai departe
    const loginBtn = screen.getByText(/Intră în cont/i);
    fireEvent.click(loginBtn);
    
    // 3. Verificăm că am ajuns pe Prezentare
    expect(screen.getByText(/Gestionare inteligentă pentru flote TIR/i)).toBeInTheDocument();
    
    // 4. Intrăm în Dashboard (am schimbat textul butonului în Gold)
    const enterButton = screen.getByText(/Deschide Dashboard/i);
    fireEvent.click(enterButton);
    
    // 5. Verificăm că am ajuns la formularul de adăugare
    expect(screen.getByText(/Adaugă Camion Nou/i)).toBeInTheDocument();
  });

  test('Permite stergerea unui camion din lista (Delete)', () => {
    render(<App />);
    
    // Navigăm rapid până la Dashboard
    fireEvent.click(screen.getByText(/Intră în cont/i));
    fireEvent.click(screen.getByText(/Deschide Dashboard/i));
    
    // Verificăm că B 101 TIR există inițial în tabel
    expect(screen.getByText('B 101 TIR')).toBeInTheDocument();
    
    // Găsim butoanele de ștergere și dăm click pe primul
    const deleteButtons = screen.getAllByText('Șterge');
    fireEvent.click(deleteButtons[0]);
    
    // Verificăm că a dispărut din tabel
    expect(screen.queryByText('B 101 TIR')).not.toBeInTheDocument();
  });

});