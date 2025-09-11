
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
