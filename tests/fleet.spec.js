const { test, expect } = require('@playwright/test');

test.describe('FleetGuard Pro - End-to-End Tests (Gold Premium Flow)', () => {

  // Acest bloc rulează ÎNAINTEA fiecărui test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 1. Robotul completează datele de Login automat
    await page.fill('input[placeholder="Utilizator"]', 'RobotTest');
    await page.fill('input[placeholder="Parola"]', '123456');
    await page.click('text=Intră în cont');
    
    // Acum robotul a ajuns cu succes pe pagina de Prezentare!
  });

  // Feature 1: Navigarea de la Prezentare la Dashboard
  test('Scenariul 1: Trebuie să poată accesa Dashboard-ul din pagina de prezentare', async ({ page }) => {
    await expect(page.locator('text=Gestionare inteligentă pentru flote TIR')).toBeVisible();
    
    // Am actualizat textul butonului conform noului design
    await page.click('text=Deschide Dashboard');
    await expect(page.locator('text=Adaugă Camion Nou')).toBeVisible();
  });

  // Feature 2: Vizualizarea detaliilor (Read Detail)
  test('Scenariul 2: Trebuie să vizualizeze detaliile unui camion specific', async ({ page }) => {
    await page.click('text=Deschide Dashboard');
    
    // În noul design, butonul se numește "Vezi"
    await page.locator('text=Vezi').first().click();
    
    // Verificăm că a apărut panoul lateral de detalii
    await expect(page.locator('text=Valabilitate Documente')).toBeVisible();
  });

  // Feature 3: Funcționalitatea de ștergere (Delete) și update UI
  test('Scenariul 3: Trebuie să șteargă un camion din tabel', async ({ page }) => {
    await page.click('text=Deschide Dashboard');
    
    // Luăm nr. de înmatriculare al primului camion din tabel
    const firstTruckPlate = await page.locator('tbody tr:first-child td:first-child').innerText();
    
    // Dăm click pe primul buton de ștergere
    await page.locator('text=Șterge').first().click();
    
    // Verificăm că textul a dispărut STRICT din <tbody> (tabel)
    await expect(page.locator(`tbody >> text=${firstTruckPlate}`)).toHaveCount(0);
  });
});