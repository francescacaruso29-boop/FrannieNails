import { spawn } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';

// WhatsApp Web automation using Python + Selenium (free solution)
const WHATSAPP_AUTOMATION_DIR = path.join(process.cwd(), 'whatsapp-bot');

// Create Python script for WhatsApp automation
const createPythonScript = () => {
  const pythonScript = `
import os
import time
import json
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import sys

class WhatsAppBot:
    def __init__(self):
        self.driver = None
        self.wait = None
        
    def setup_driver(self):
        """Setup Chrome WebDriver for WhatsApp Web"""
        chrome_options = Options()
        chrome_options.add_argument("--user-data-dir=./whatsapp_session")
        chrome_options.add_argument("--profile-directory=Default")
        chrome_options.add_argument("--disable-web-security")
        chrome_options.add_argument("--disable-features=VizDisplayCompositor")
        
        # For headless mode (uncomment next line for background operation)
        # chrome_options.add_argument("--headless")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        self.wait = WebDriverWait(self.driver, 30)
        
    def login_whatsapp(self):
        """Open WhatsApp Web and wait for QR scan"""
        print("🔗 Aprendo WhatsApp Web...")
        self.driver.get("https://web.whatsapp.com")
        
        try:
            # Wait for QR code or main interface
            print("📱 Scansiona il codice QR con il tuo telefono...")
            
            # Wait for chat list to load (means we're logged in)
            self.wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="chat-list"]')))
            print("✅ Login riuscito!")
            return True
            
        except TimeoutException:
            print("❌ Timeout durante il login. Riprova.")
            return False
    
    def send_message(self, contact_name, message):
        """Send message to a specific contact"""
        try:
            # Search for contact
            search_box = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="chat-list-search"]')))
            search_box.clear()
            search_box.send_keys(contact_name)
            time.sleep(2)
            
            # Click on contact
            contact = self.wait.until(EC.element_to_be_clickable((By.XPATH, f'//span[@title="{contact_name}"]')))
            contact.click()
            time.sleep(1)
            
            # Type and send message
            message_box = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="conversation-compose-box-input"]')))
            message_box.clear()
            message_box.send_keys(message)
            
            # Send message
            send_button = self.wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="send"]')))
            send_button.click()
            
            print(f"✅ Messaggio inviato a {contact_name}")
            return True
            
        except Exception as e:
            print(f"❌ Errore invio messaggio a {contact_name}: {str(e)}")
            return False
    
    def send_bulk_messages(self, messages_file):
        """Send multiple messages from JSON file"""
        try:
            with open(messages_file, 'r', encoding='utf-8') as f:
                messages = json.load(f)
            
            success_count = 0
            for msg in messages:
                contact = msg.get('contact')
                text = msg.get('message')
                
                if self.send_message(contact, text):
                    success_count += 1
                
                # Wait between messages to avoid being flagged
                time.sleep(5)
            
            print(f"✅ Inviati {success_count}/{len(messages)} messaggi")
            
        except Exception as e:
            print(f"❌ Errore invio bulk: {str(e)}")
    
    def close(self):
        """Close browser"""
        if self.driver:
            self.driver.quit()

def main():
    if len(sys.argv) < 2:
        print("Uso: python whatsapp_bot.py <comando> [parametri]")
        print("Comandi:")
        print("  login - Effettua login")
        print("  send <contatto> <messaggio> - Invia messaggio singolo")
        print("  bulk <file_json> - Invia messaggi multipli")
        return
    
    bot = WhatsAppBot()
    bot.setup_driver()
    
    command = sys.argv[1]
    
    try:
        if command == "login":
            bot.login_whatsapp()
            input("Premi Enter per chiudere...")
            
        elif command == "send" and len(sys.argv) >= 4:
            if bot.login_whatsapp():
                contact = sys.argv[2]
                message = " ".join(sys.argv[3:])
                bot.send_message(contact, message)
            
        elif command == "bulk" and len(sys.argv) >= 3:
            if bot.login_whatsapp():
                messages_file = sys.argv[2]
                bot.send_bulk_messages(messages_file)
        else:
            print("❌ Comando non valido")
            
    finally:
        bot.close()

if __name__ == "__main__":
    main()
`;

  return pythonScript;
};

// Create requirements.txt for Python dependencies
const createRequirements = () => {
  return `selenium==4.15.0
webdriver-manager==4.0.1
`;
};

// Create setup script
const createSetupScript = () => {
  return `#!/bin/bash
echo "🚀 Configurazione WhatsApp Bot..."

# Install Python dependencies
pip install -r requirements.txt

# Download ChromeDriver
python -c "from webdriver_manager.chrome import ChromeDriverManager; ChromeDriverManager().install()"

echo "✅ Setup completato!"
echo "📱 Ora puoi usare il bot WhatsApp"
`;
};

export interface WhatsAppMessage {
  contact: string;
  message: string;
}

export class WhatsAppAutomation {
  private botDir: string;

  constructor() {
    this.botDir = WHATSAPP_AUTOMATION_DIR;
    this.ensureBotDirectory();
  }

  private ensureBotDirectory() {
    if (!existsSync(this.botDir)) {
      mkdirSync(this.botDir, { recursive: true });
    }

    // Create Python script
    const scriptPath = path.join(this.botDir, 'whatsapp_bot.py');
    if (!existsSync(scriptPath)) {
      writeFileSync(scriptPath, createPythonScript());
    }

    // Create requirements.txt
    const reqPath = path.join(this.botDir, 'requirements.txt');
    if (!existsSync(reqPath)) {
      writeFileSync(reqPath, createRequirements());
    }

    // Create setup script
    const setupPath = path.join(this.botDir, 'setup.sh');
    if (!existsSync(setupPath)) {
      writeFileSync(setupPath, createSetupScript());
    }
  }

  async sendSingleMessage(contact: string, message: string): Promise<boolean> {
    console.log(`📞 Tentativo invio messaggio a: ${contact}`);
    console.log(`💬 Messaggio: ${message.substring(0, 50)}...`);
    
    return new Promise((resolve) => {
      const pythonPath = path.join(this.botDir, 'whatsapp_bot.py');
      const process = spawn('python3', [pythonPath, 'send', contact, message], {
        cwd: this.botDir,
        stdio: 'pipe'
      });

      let output = '';
      process.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(`🐍 Python bot output: ${text}`);
      });

      process.stderr.on('data', (data) => {
        console.error(`🐍 Python bot error: ${data.toString()}`);
      });

      process.on('close', (code) => {
        console.log(`🐍 Python process exited with code: ${code}`);
        console.log(`📝 Full output: ${output}`);
        
        const success = code === 0 && (output.includes('✅') || output.includes('SUCCESS'));
        console.log(`${success ? '✅' : '❌'} WhatsApp bot result: ${success ? 'SUCCESS' : 'FAILED'}`);
        
        resolve(success);
      });
    });
  }

  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<boolean> {
    // Create JSON file with messages
    const messagesFile = path.join(this.botDir, 'messages.json');
    writeFileSync(messagesFile, JSON.stringify(messages, null, 2));

    return new Promise((resolve) => {
      const pythonPath = path.join(this.botDir, 'whatsapp_bot.py');
      const process = spawn('python', [pythonPath, 'bulk', 'messages.json'], {
        cwd: this.botDir,
        stdio: 'pipe'
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });

      process.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  async setupBot(): Promise<boolean> {
    console.log('🔧 Configurazione WhatsApp Bot...');
    
    return new Promise((resolve) => {
      const setupPath = path.join(this.botDir, 'setup.sh');
      const process = spawn('bash', [setupPath], {
        cwd: this.botDir,
        stdio: 'pipe'
      });

      process.stdout.on('data', (data) => {
        console.log(data.toString());
      });

      process.stderr.on('data', (data) => {
        console.error(data.toString());
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  async loginBot(): Promise<boolean> {
    console.log('📱 Avvio login WhatsApp...');
    
    return new Promise((resolve) => {
      const pythonPath = path.join(this.botDir, 'whatsapp_bot.py');
      const process = spawn('python', [pythonPath, 'login'], {
        cwd: this.botDir,
        stdio: 'inherit' // Allow interaction for QR code
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  getBotInstructions(): string {
    return `
🤖 **WhatsApp Bot Gratuito Configurato!**

**Come usare:**

1. **Setup iniziale:**
   \`\`\`bash
   cd whatsapp-bot
   bash setup.sh
   \`\`\`

2. **Primo login:**
   \`\`\`bash
   python whatsapp_bot.py login
   \`\`\`
   Poi scansiona il QR code

3. **Invia messaggio singolo:**
   \`\`\`bash
   python whatsapp_bot.py send "Nome Contatto" "Ciao! Promemoria appuntamento domani alle 10:30"
   \`\`\`

4. **Messaggi multipli:**
   Crea file \`messages.json\`:
   \`\`\`json
   [
     {"contact": "Maria Rossi", "message": "Promemoria appuntamento domani 10:30"},
     {"contact": "Giulia Bianchi", "message": "Promemoria appuntamento domani 15:00"}
   ]
   \`\`\`
   
   Poi:
   \`\`\`bash
   python whatsapp_bot.py bulk messages.json
   \`\`\`

**Vantaggi:**
✅ Completamente gratuito
✅ Nessun limite di messaggi
✅ Usa il tuo WhatsApp normale
✅ Automazione programmabile

**Note:**
- Il primo setup richiede scansione QR
- Una volta loggato, rimane collegato
- Rispetta i limiti WhatsApp (non spam)
`;
  }
}

// Create global instance for easy use
const whatsappBot = new WhatsAppAutomation();

// Export convenience function for single message sending
export async function sendSingleMessage(phoneNumber: string, message: string): Promise<boolean> {
  console.log('🚀 Invio automatico WhatsApp attivato!');
  return await whatsappBot.sendSingleMessage(phoneNumber, message);
}

// Export convenience function for bulk messages
export async function sendBulkMessages(messages: WhatsAppMessage[]): Promise<boolean> {
  return await whatsappBot.sendBulkMessages(messages);
}

// Export the class for advanced usage
export default WhatsAppAutomation;