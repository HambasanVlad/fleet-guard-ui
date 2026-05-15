import { validateTruck } from './validators';

describe('Truck Validation Logic', () => {
  const validTruck = {
    licensePlate: 'B 123 ABC', brand: 'Volvo',
    rcaStartDate: '2025-01-01', rcaExpiry: '2026-01-01',
    itpStartDate: '2025-01-01', itpExpiry: '2026-01-01',
    rovinietaStartDate: '2025-01-01', rovinietaExpiry: '2026-01-01'
  };

  test('nu returneaza erori pentru un camion valid', () => {
    expect(Object.keys(validateTruck(validTruck)).length).toBe(0);
  });

  test('returneaza eroare pentru număr inmatriculare invalid', () => {
    const truck = { ...validTruck, licensePlate: 'B123ABC' };
    expect(validateTruck(truck).licensePlate).toBe("Format invalid! Ex: B 123 ABC");
  });

  test('returneaza eroare daca brandul lipseste', () => {
    const truck = { ...validTruck, brand: '' };
    expect(validateTruck(truck).brand).toBe("Brandul este obligatoriu.");
  });

  // --- Teste RCA ---
  test('returneaza eroare daca lipsesc datele RCA', () => {
    const truck = { ...validTruck, rcaStartDate: '' };
    expect(validateTruck(truck).rca).toBe("Completati ambele date pentru RCA.");
  });

  test('returneaza eroare daca expirarea RCA este inainte de incepere', () => {
    const truck = { ...validTruck, rcaStartDate: '2026-01-01', rcaExpiry: '2025-01-01' };
    expect(validateTruck(truck).rca).toBe("Expirarea RCA trebuie să fie după data de începere.");
  });

  // --- Teste ITP ---
  test('returneaza eroare daca lipsesc datele ITP', () => {
    const truck = { ...validTruck, itpStartDate: '' };
    expect(validateTruck(truck).itp).toBe("Completati ambele date pentru ITP.");
  });

  test('returneaza eroare daca expirarea ITP este inainte de incepere', () => {
    const truck = { ...validTruck, itpStartDate: '2026-01-01', itpExpiry: '2025-01-01' };
    expect(validateTruck(truck).itp).toBe("Expirarea ITP trebuie să fie după data de începere.");
  });

  // --- Teste Rovinieta ---
  test('returneaza eroare daca lipsesc datele Rovinietei', () => {
    const truck = { ...validTruck, rovinietaStartDate: '' };
    expect(validateTruck(truck).rovinieta).toBe("Completati ambele date pentru Rovinietă.");
  });

  test('returneaza eroare daca expirarea Rovinietei este inainte de incepere', () => {
    const truck = { ...validTruck, rovinietaStartDate: '2026-01-01', rovinietaExpiry: '2025-01-01' };
    expect(validateTruck(truck).rovinieta).toBe("Expirarea Rovinietei trebuie să fie după data de începere.");
  });
});