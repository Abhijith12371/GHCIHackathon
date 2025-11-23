import os
import httpx
import google.generativeai as genai
from dotenv import load_dotenv
import time
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading

# ---------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------
load_dotenv()

TELLER_TOKEN = os.getenv("TELLER_TOKEN")
CERT_FILE = os.getenv("TELLER_CERT")
KEY_FILE = os.getenv("TELLER_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

BASE_URL = "https://api.teller.io"

# ---------------------------------------------------------
# Enhanced Banking Service with REAL Payment Tracking
# ---------------------------------------------------------
class BankingService:
    def __init__(self):
        if not TELLER_TOKEN:
            raise RuntimeError("TELLER_TOKEN not found in .env")
        if not os.path.exists(CERT_FILE):
            raise RuntimeError(f"Cert file missing: {CERT_FILE}")
        if not os.path.exists(KEY_FILE):
            raise RuntimeError(f"Key file missing: {KEY_FILE}")
        
        # File to track our simulated payments
        self.payments_file = "simulated_payments.json"
        self.load_payments()

    def load_payments(self):
        """Load simulated payments from file"""
        try:
            if os.path.exists(self.payments_file):
                with open(self.payments_file, 'r') as f:
                    self.simulated_payments = json.load(f)
            else:
                self.simulated_payments = []
        except:
            self.simulated_payments = []

    def save_payments(self):
        """Save simulated payments to file"""
        try:
            with open(self.payments_file, 'w') as f:
                json.dump(self.simulated_payments, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save payments: {e}")

    def client(self):
        return httpx.Client(
            cert=(CERT_FILE, KEY_FILE),
            auth=(TELLER_TOKEN, ""),
            timeout=10.0
        )

    def get_accounts(self):
        with self.client() as c:
            res = c.get(f"{BASE_URL}/accounts")
            res.raise_for_status()
            return res.json()

    def get_default_account_id(self):
        accounts = self.get_accounts()
        if accounts:
            return accounts[0]["id"]
        return None

    def get_balance(self, account_id):
        """Get REAL balance from Teller API"""
        with self.client() as c:
            res = c.get(f"{BASE_URL}/accounts/{account_id}/balances")
            res.raise_for_status()
            balance_data = res.json()
            
            # Calculate adjusted balance considering our simulated payments
            real_balance = float(balance_data.get('available', 0))
            adjusted_balance = self.calculate_adjusted_balance(real_balance)
            
            return {
                'real_available': real_balance,
                'available': adjusted_balance,
                'ledger': float(balance_data.get('ledger', 0))
            }

    def calculate_adjusted_balance(self, real_balance):
        """Calculate balance after deducting simulated payments"""
        total_pending_payments = sum(
            float(payment['amount']) 
            for payment in self.simulated_payments 
            if payment['status'] == 'completed'
        )
        return real_balance - total_pending_payments

    def get_transactions(self, account_id, count=5):
        with self.client() as c:
            res = c.get(
                f"{BASE_URL}/accounts/{account_id}/transactions",
                params={"count": count}
            )
            res.raise_for_status()
            return res.json()

    def get_payees(self):
        """Get list of payees from transaction history"""
        try:
            account_id = self.get_default_account_id()
            if not account_id:
                return []
            
            transactions = self.get_transactions(account_id, count=50)
            payees = set()
            
            for transaction in transactions:
                description = transaction.get('description', '').strip()
                if description and description not in ['', 'Payment', 'Transfer']:
                    payee_name = self._extract_payee_name(description)
                    if payee_name:
                        payees.add(payee_name)
            
            return sorted(list(payees))
        except Exception as e:
            print(f"Error getting payees: {e}")
            return []

    def _extract_payee_name(self, description):
        """Extract clean payee name from transaction description"""
        description = description.replace('POS ', '').replace('ATM ', '')
        description = description.replace('DEBIT ', '').replace('CREDIT ', '')
        description = description.replace('PURCHASE ', '').replace('PAYMENT ', '')
        
        parts = description.split()
        if parts:
            clean_parts = []
            for part in parts:
                if not any(char.isdigit() for char in part) and len(part) > 2:
                    clean_parts.append(part)
            
            if clean_parts:
                return ' '.join(clean_parts[:3])
        
        return description[:20]

    def make_payment(self, payee_name, amount, account_id=None):
        """
        ACTUAL payment simulation that tracks balance changes
        """
        try:
            if not account_id:
                account_id = self.get_default_account_id()
            
            if not account_id:
                return False, "No account found"
            
            # Get current REAL balance
            balance_info = self.get_balance(account_id)
            real_balance = balance_info['real_available']
            current_balance = balance_info['available']
            payment_amount = float(amount)
            
            print(f"💰 Processing payment: ${payment_amount:.2f} to {payee_name}")
            print(f"📊 Current balance: ${current_balance:.2f}")
            
            # Check if sufficient balance (considering real balance)
            if real_balance < payment_amount:
                return False, f"Insufficient funds. Your actual balance is ${real_balance:.2f}"
            
            if current_balance < payment_amount:
                return False, f"Insufficient available balance. Available: ${current_balance:.2f}"
            
            # Create and record the payment
            payment_record = {
                'id': f"sim_pay_{int(time.time())}",
                'payee': payee_name,
                'amount': payment_amount,
                'date': datetime.now().isoformat(),
                'status': 'completed',
                'account_id': account_id,
                'description': f'Payment to {payee_name}'
            }
            
            # Add to our simulated payments
            self.simulated_payments.append(payment_record)
            self.save_payments()
            
            # Calculate new balance
            new_balance = current_balance - payment_amount
            
            return True, {
                'message': f"Payment of ${payment_amount:.2f} to {payee_name} completed successfully!",
                'new_balance': new_balance,
                'amount_paid': payment_amount,
                'payee': payee_name
            }
            
        except Exception as e:
            return False, f"Payment failed: {str(e)}"

    def get_payment_history(self):
        """Get history of simulated payments"""
        return self.simulated_payments[-5:]  # Last 5 payments

    def get_recent_payments(self, count=3):
        """Get recent payments for confirmation"""
        recent = self.simulated_payments[-count:]
        return recent[::-1]  # Reverse to show newest first


# ---------------------------------------------------------
# AI Service for Natural Language Processing
# ---------------------------------------------------------
class AIService:
    def __init__(self):
        if GEMINI_API_KEY:
            genai.configure(api_key=GEMINI_API_KEY)
            self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
            print("✓ Gemini AI ready!")
        else:
            self.gemini_model = None
            print("⚠️ Gemini API key not found")

    def detect_intent(self, text):
        if not text:
            return "UNKNOWN"
        text = text.lower()

        # Payment exit commands should have highest priority
        if any(w in text for w in ["cancel", "stop", "nevermind", "not now", "exit payment", "don't pay"]):
            return "CANCEL_PAYMENT"
        if any(w in text for w in ["go back", "main menu", "start over", "different", "something else"]):
            return "GO_BACK"
        if any(w in text for w in ["what can you do", "options", "menu"]):
            return "HELP"
        
        # Rest of existing intent detection
        if any(w in text for w in ["hello", "hi", "hey", "good morning"]):
            return "GREETING"
        if any(w in text for w in ["balance", "how much", "money"]):
            return "CHECK_BALANCE"
        if any(w in text for w in ["transaction", "history", "payments", "recent"]):
            return "VIEW_TRANSACTIONS"
        if any(w in text for w in ["spent", "spending"]):
            return "SPENDING_SUMMARY"
        if any(w in text for w in ["payee", "payees", "who i pay", "merchants", "user list", "pay list", "list of payees"]):
            return "VIEW_PAYEES"
        if any(w in text for w in ["pay", "send money", "transfer", "make payment"]):
            return "MAKE_PAYMENT"
        if any(w in text for w in ["payment history", "my payments", "recent payments"]):
            return "PAYMENT_HISTORY"
        if "help" in text:
            return "HELP"
        if any(w in text for w in ["bye", "goodbye", "exit", "quit"]):
            return "FAREWELL"
        return "GENERAL_INQUIRY"

    def enhance_conversation(self, user_input, banking_context=""):
        """Use Gemini for natural responses"""
        if not self.gemini_model:
            return None
            
        try:
            prompt = f"""You're a friendly banking assistant. User said: "{user_input}"

Context: {banking_context}

Provide ONLY a brief, friendly acknowledgment (1 sentence max).
DO NOT provide banking data - that will be added separately.
DO NOT say you can't access data - you can.

Examples:
- "Sure, let me check that for you"
- "Of course, here's what I found"
- "Absolutely, let me pull that up"

Keep it very short and natural."""
            
            response = self.gemini_model.generate_content(prompt)
            text = response.text.strip()
            
            # Remove any overly long responses
            if len(text) > 100:
                return None
                
            return text
            
        except Exception as e:
            print(f"⚠️ Gemini error: {e}")
            return None


# ---------------------------------------------------------
# Banking Assistant Service
# ---------------------------------------------------------
class BankingAssistantService:
    def __init__(self):
        self.bank = BankingService()
        self.ai = AIService()
        self.user_sessions = {}

    def get_user_session(self, user_id):
        """Get or create user session"""
        if user_id not in self.user_sessions:
            self.user_sessions[user_id] = {
                'payment_mode': False,
                'current_payee': None,
                'current_amount': None,
                'last_active': time.time()
            }
        return self.user_sessions[user_id]

    def cleanup_sessions(self):
        """Clean up old sessions (older than 1 hour)"""
        current_time = time.time()
        expired_users = []
        for user_id, session in self.user_sessions.items():
            if current_time - session['last_active'] > 3600:  # 1 hour
                expired_users.append(user_id)
        
        for user_id in expired_users:
            del self.user_sessions[user_id]

    def get_banking_context(self, user_id):
        try:
            account_id = self.bank.get_default_account_id()
            if account_id:
                balance_info = self.bank.get_balance(account_id)
                return f"Balance: {balance_info.get('available', 'Unknown')}"
        except:
            pass
        return ""

    def handle_payment_flow(self, user_id, text):
        """Handle multi-step payment process with REAL tracking and escape routes"""
        session = self.get_user_session(user_id)
        session['last_active'] = time.time()

        # FIRST check if user wants to exit payment mode
        intent = self.ai.detect_intent(text)
        if intent in ["CANCEL_PAYMENT", "GO_BACK", "HELP"]:
            session['payment_mode'] = False
            session['current_payee'] = None
            session['current_amount'] = None
            
            if intent == "CANCEL_PAYMENT":
                return {
                    "response": "Okay, cancelled the payment. What would you like to do instead?",
                    "payment_mode": False,
                    "next_step": None
                }
            elif intent == "HELP":
                return {
                    "response": "I can: check your balance, show transactions, list payees, make payments, or show payment history. What would you like to do?",
                    "payment_mode": False,
                    "next_step": None
                }
            else:
                return {
                    "response": "Okay, let's start over. How can I help you?",
                    "payment_mode": False,
                    "next_step": None
                }

        if not session['current_payee']:
            # Step 1: Extract payee name
            payees = self.bank.get_payees()
            if not payees:
                session['payment_mode'] = False
                return {
                    "response": "I couldn't find any payees in your transaction history. Please add payees manually.",
                    "payment_mode": False,
                    "next_step": None
                }
            
            # Check if user is asking for payee list instead of selecting one
            if any(word in text.lower() for word in ["list", "show", "what", "who", "payees", "users", "all payees"]):
                payee_list = ", ".join(payees[:8])
                if len(payees) > 8:
                    payee_list += f" and {len(payees) - 8} more"
                
                return {
                    "response": f"Here are your payees: {payee_list}. Who would you like to pay? (Say 'cancel' to stop)",
                    "payment_mode": True,
                    "next_step": "payee"
                }
            
            # Try to find mentioned payee
            mentioned_payee = None
            text_lower = text.lower()
            for payee in payees:
                payee_lower = payee.lower()
                # Check if any word from payee is in the text
                if any(word in text_lower for word in payee_lower.split() if len(word) > 2):
                    mentioned_payee = payee
                    break
            
            if mentioned_payee:
                session['current_payee'] = mentioned_payee
                return {
                    "response": f"I found {mentioned_payee} in your payees. How much would you like to pay? (Say 'cancel' to stop)",
                    "payment_mode": True,
                    "next_step": "amount"
                }
            else:
                # List available payees
                payee_list = ", ".join(payees[:5])
                if len(payees) > 5:
                    payee_list += f" and {len(payees) - 5} more"
                
                return {
                    "response": f"I found these payees in your history: {payee_list}. Who would you like to pay? (Say 'cancel' to stop or 'list all' to see more)",
                    "payment_mode": True,
                    "next_step": "payee"
                }
        
        elif not session['current_amount']:
            # Step 2: Extract amount
            # Check if user is trying to change payee or exit
            if any(word in text.lower() for word in ["different", "change", "other", "new payee", "wrong payee"]):
                session['current_payee'] = None
                payees = self.bank.get_payees()
                payee_list = ", ".join(payees[:5])
                return {
                    "response": f"Okay, let's choose a different payee. Your payees include: {payee_list}. Who would you like to pay?",
                    "payment_mode": True,
                    "next_step": "payee"
                }
            
            try:
                # Enhanced amount extraction
                words = text.replace('$', ' $').replace('rs', ' $').replace('rupees', ' $').replace('₹', ' $').split()
                amount_found = None
                
                for i, word in enumerate(words):
                    clean_word = word.replace('$', '').replace(',', '').replace('₹', '').strip()
                    
                    # Handle number words
                    number_words = {
                        'hundred': 100, 'thousand': 1000, 'lakh': 100000,
                        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
                        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
                        'twenty': 20, 'thirty': 30, 'forty': 40, 'fifty': 50,
                        'sixty': 60, 'seventy': 70, 'eighty': 80, 'ninety': 90
                    }
                    
                    if clean_word in number_words:
                        amount_found = number_words[clean_word]
                    elif clean_word.replace('.', '').isdigit():
                        amount_found = float(clean_word)
                        break
                
                if amount_found:
                    session['current_amount'] = amount_found
                    # Get current balance for confirmation
                    account_id = self.bank.get_default_account_id()
                    balance_info = self.bank.get_balance(account_id) if account_id else None
                    current_balance = balance_info['available'] if balance_info else 'unknown'
                    
                    return {
                        "response": f"Confirm payment: ${session['current_amount']:.2f} to {session['current_payee']}. Your current balance is ${current_balance:.2f}. Say 'confirm' to proceed or 'cancel' to stop.",
                        "payment_mode": True,
                        "next_step": "confirmation"
                    }
                else:
                    return {
                        "response": "I didn't catch the amount. Please say something like 'fifty dollars' or '$50'. Say 'cancel' to stop the payment.",
                        "payment_mode": True,
                        "next_step": "amount"
                    }
            
            except ValueError:
                return {
                    "response": "I didn't understand the amount. Please say something like 'fifty dollars' or '$50'. Say 'cancel' to stop the payment.",
                    "payment_mode": True,
                    "next_step": "amount"
                }
        
        else:
            # Step 3: Confirm payment
            if any(word in text.lower() for word in ['yes', 'confirm', 'proceed', 'ok', 'do it', 'confirm the payment']):
                success, result = self.bank.make_payment(session['current_payee'], session['current_amount'])
                
                if success:
                    # Payment successful
                    response = {
                        "response": f"✅ {result['message']} New balance: ${result['new_balance']:.2f}",
                        "payment_mode": False,
                        "next_step": None,
                        "payment_success": True,
                        "new_balance": result['new_balance']
                    }
                    
                    # Reset payment state
                    session['current_payee'] = None
                    session['current_amount'] = None
                    session['payment_mode'] = False
                    
                    return response
                else:
                    # Payment failed
                    session['current_payee'] = None
                    session['current_amount'] = None
                    session['payment_mode'] = False
                    return {
                        "response": f"❌ {result}",
                        "payment_mode": False,
                        "next_step": None,
                        "payment_success": False
                    }
            else:
                # Cancel payment
                session['current_payee'] = None
                session['current_amount'] = None
                session['payment_mode'] = False
                return {
                    "response": "❌ Payment cancelled. What would you like to do instead?",
                    "payment_mode": False,
                    "next_step": None
                }

    def process_message(self, user_id, message):
        """Process user message and return response"""
        # Clean up old sessions periodically
        if len(self.user_sessions) > 100:  # If too many sessions, clean up
            self.cleanup_sessions()

        session = self.get_user_session(user_id)
        
        # Check if we're in payment mode - but first check for exit commands
        intent = self.ai.detect_intent(message)
        
        # Allow these commands to break out of payment mode
        if session['payment_mode'] and intent in ["CANCEL_PAYMENT", "GO_BACK", "HELP"]:
            session['payment_mode'] = False
            session['current_payee'] = None
            session['current_amount'] = None
            
            if intent == "CANCEL_PAYMENT":
                return {
                    "response": "Okay, cancelled the payment. What would you like to do instead?",
                    "payment_mode": False
                }
            elif intent == "HELP":
                return {
                    "response": "I can: check your balance, show transactions, list payees, make payments, or show payment history. What would you like to do?",
                    "payment_mode": False
                }
        
        # Check if we're in payment mode (after handling potential exits)
        if session['payment_mode']:
            return self.handle_payment_flow(user_id, message)

        # Handle normal intents
        try:
            if intent == "GREETING":
                context = self.get_banking_context(user_id)
                natural = self.ai.enhance_conversation(message, context)
                return {
                    "response": natural or "Hello! I can help with balances, transactions, payees, payments, and payment history. How can I assist you?",
                    "intent": "GREETING",
                    "payment_mode": False
                }
                
            elif intent == "FAREWELL":
                if user_id in self.user_sessions:
                    del self.user_sessions[user_id]
                return {
                    "response": "Goodbye! Have a great day!",
                    "intent": "FAREWELL",
                    "payment_mode": False
                }
                
            elif intent == "HELP":
                return {
                    "response": "I can: check your balance, show transactions, list payees, make payments, or show payment history. What would you like to do?",
                    "intent": "HELP",
                    "payment_mode": False
                }
                
            elif intent == "CHECK_BALANCE":
                account_id = self.bank.get_default_account_id()
                if not account_id:
                    return {
                        "response": "I couldn't find any accounts.",
                        "intent": "CHECK_BALANCE",
                        "payment_mode": False
                    }
                
                info = self.bank.get_balance(account_id)
                balance = info.get('available', 'Unknown')
                real_balance = info.get('real_available', balance)
                
                context = f"User's balance is {balance}"
                natural = self.ai.enhance_conversation(message, context)
                
                if natural and "balance" not in natural.lower():
                    response_text = f"{natural} Your available balance is ${balance:.2f}."
                else:
                    response_text = f"Your available balance is ${balance:.2f}."
                
                return {
                    "response": response_text,
                    "intent": "CHECK_BALANCE",
                    "balance": balance,
                    "real_balance": real_balance,
                    "payment_mode": False
                }
                
            elif intent == "VIEW_TRANSACTIONS":
                account_id = self.bank.get_default_account_id()
                if not account_id:
                    return {
                        "response": "I couldn't find any accounts.",
                        "intent": "VIEW_TRANSACTIONS",
                        "payment_mode": False
                    }
                
                txs = self.bank.get_transactions(account_id, count=5)
                if not txs:
                    return {
                        "response": "You have no recent transactions.",
                        "intent": "VIEW_TRANSACTIONS",
                        "payment_mode": False
                    }
                
                response = "Here are your recent transactions. "
                transactions_list = []
                for i, t in enumerate(txs[:5], 1):
                    desc = t.get('description', 'Unknown transaction')
                    amt = t.get('amount', '0')
                    
                    try:
                        amt_float = float(amt)
                        if amt_float < 0:
                            amt_str = f"spent ${abs(amt_float):.2f}"
                        else:
                            amt_str = f"received ${amt_float:.2f}"
                    except:
                        amt_str = f"amount {amt}"
                    
                    response += f"Transaction {i}: {desc}, {amt_str}. "
                    transactions_list.append({
                        "description": desc,
                        "amount": amt,
                        "formatted_amount": amt_str
                    })
                
                return {
                    "response": response,
                    "intent": "VIEW_TRANSACTIONS",
                    "transactions": transactions_list,
                    "payment_mode": False
                }
                
            elif intent == "SPENDING_SUMMARY":
                account_id = self.bank.get_default_account_id()
                if not account_id:
                    return {
                        "response": "I couldn't access your account.",
                        "intent": "SPENDING_SUMMARY",
                        "payment_mode": False
                    }
                
                txs = self.bank.get_transactions(account_id, count=10)
                
                total_spent = 0
                num_expenses = 0
                for t in txs:
                    try:
                        amt = float(t.get("amount", 0))
                        if amt < 0:
                            total_spent += abs(amt)
                            num_expenses += 1
                    except:
                        continue
                
                if num_expenses == 0:
                    return {
                        "response": "You have no expenses in your recent transactions.",
                        "intent": "SPENDING_SUMMARY",
                        "payment_mode": False
                    }
                
                return {
                    "response": f"You have spent a total of ${total_spent:.2f} across {num_expenses} transactions in your recent history.",
                    "intent": "SPENDING_SUMMARY",
                    "total_spent": total_spent,
                    "num_expenses": num_expenses,
                    "payment_mode": False
                }
                
            elif intent == "VIEW_PAYEES":
                payees = self.bank.get_payees()
                if not payees:
                    return {
                        "response": "I couldn't find any payees in your transaction history.",
                        "intent": "VIEW_PAYEES",
                        "payment_mode": False
                    }
                
                if len(payees) <= 5:
                    payee_list = ", ".join(payees)
                    response_text = f"I found these payees: {payee_list}. You can say 'pay [payee name]' to make a payment."
                else:
                    payee_list = ", ".join(payees[:5])
                    response_text = f"I found {len(payees)} payees including: {payee_list}, and more. You can say 'pay [payee name]' to make a payment."
                
                return {
                    "response": response_text,
                    "intent": "VIEW_PAYEES",
                    "payees": payees,
                    "payment_mode": False
                }
                
            elif intent == "MAKE_PAYMENT":
                session['payment_mode'] = True
                payees = self.bank.get_payees()
                
                if not payees:
                    session['payment_mode'] = False
                    return {
                        "response": "I couldn't find any payees in your transaction history. Please add payees manually.",
                        "intent": "MAKE_PAYMENT",
                        "payment_mode": False
                    }
                
                return {
                    "response": "I'll help you make a payment. Who would you like to pay? You can say a name from your payee list. (Say 'cancel' anytime to stop)",
                    "intent": "MAKE_PAYMENT",
                    "payment_mode": True,
                    "next_step": "payee"
                }
                
            elif intent == "PAYMENT_HISTORY":
                payments = self.bank.get_payment_history()
                if not payments:
                    return {
                        "response": "You haven't made any payments yet.",
                        "intent": "PAYMENT_HISTORY",
                        "payment_mode": False
                    }
                
                response = "Here are your recent payments: "
                payment_list = []
                for i, payment in enumerate(payments, 1):
                    response += f"Payment {i}: ${payment['amount']:.2f} to {payment['payee']}. "
                    payment_list.append({
                        "payee": payment['payee'],
                        "amount": payment['amount'],
                        "date": payment['date']
                    })
                
                return {
                    "response": response,
                    "intent": "PAYMENT_HISTORY",
                    "payments": payment_list,
                    "payment_mode": False
                }
                
            else:
                context = self.get_banking_context(user_id)
                natural = self.ai.enhance_conversation(message, context)
                
                if natural:
                    return {
                        "response": natural,
                        "intent": "GENERAL_INQUIRY",
                        "payment_mode": False
                    }
                else:
                    return {
                        "response": "I can help you check balances, view transactions, list payees, make payments, or show payment history. What would you like to do?",
                        "intent": "GENERAL_INQUIRY",
                        "payment_mode": False
                    }
                
        except Exception as e:
            print(f"⚠️ Error: {e}")
            import traceback
            traceback.print_exc()
            return {
                "response": "Sorry, I'm having trouble accessing your banking information right now.",
                "intent": "ERROR",
                "payment_mode": False
            }


# ---------------------------------------------------------
# Flask API Server
# ---------------------------------------------------------
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the banking assistant service
assistant_service = BankingAssistantService()

@app.route('/')
def home():
    return jsonify({
        "message": "Voice Banking Assistant API",
        "status": "running",
        "endpoints": {
            "/api/chat": "POST - Send text messages",
            "/api/accounts": "GET - Get account information",
            "/api/balance": "GET - Get account balance",
            "/api/transactions": "GET - Get recent transactions",
            "/api/payees": "GET - Get payee list",
            "/api/payments": "GET - Get payment history",
            "/api/health": "GET - Health check"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint for processing user messages"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        user_id = data.get('user_id', 'default_user')
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        print(f"📨 Received message from {user_id}: {message}")
        
        # Process the message
        response = assistant_service.process_message(user_id, message)
        
        print(f"📤 Sending response: {response['response'][:100]}...")
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error in /api/chat: {e}")
        return jsonify({
            "error": "Internal server error",
            "response": "Sorry, I encountered an error processing your request."
        }), 500

@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    """Get account information"""
    try:
        accounts = assistant_service.bank.get_accounts()
        return jsonify({"accounts": accounts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/balance', methods=['GET'])
def get_balance():
    """Get account balance"""
    try:
        account_id = request.args.get('account_id')
        if not account_id:
            account_id = assistant_service.bank.get_default_account_id()
        
        if not account_id:
            return jsonify({"error": "No account found"}), 404
        
        balance_info = assistant_service.bank.get_balance(account_id)
        return jsonify({"balance": balance_info})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get recent transactions"""
    try:
        account_id = request.args.get('account_id')
        count = int(request.args.get('count', 5))
        
        if not account_id:
            account_id = assistant_service.bank.get_default_account_id()
        
        if not account_id:
            return jsonify({"error": "No account found"}), 404
        
        transactions = assistant_service.bank.get_transactions(account_id, count)
        return jsonify({"transactions": transactions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/payees', methods=['GET'])
def get_payees():
    """Get payee list"""
    try:
        payees = assistant_service.bank.get_payees()
        return jsonify({"payees": payees})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/payments', methods=['GET'])
def get_payments():
    """Get payment history"""
    try:
        payments = assistant_service.bank.get_payment_history()
        return jsonify({"payments": payments})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/direct-payment', methods=['POST'])
def direct_payment():
    """Make a direct payment without chat flow"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        payee = data.get('payee')
        amount = data.get('amount')
        account_id = data.get('account_id')
        
        if not payee or not amount:
            return jsonify({"error": "Payee and amount are required"}), 400
        
        success, result = assistant_service.bank.make_payment(payee, amount, account_id)
        
        if success:
            return jsonify({
                "success": True,
                "message": result['message'],
                "new_balance": result['new_balance']
            })
        else:
            return jsonify({
                "success": False,
                "error": result
            }), 400
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def main():
    print("\n" + "="*60)
    print("🚀 VOICE BANKING ASSISTANT API STARTING")
    print("="*60)
    
    try:
        # Test banking connection
        accounts = assistant_service.bank.get_accounts()
        print(f"✓ Connected to banking API. Found {len(accounts)} accounts.")
        
        # Start the Flask server
        print("✓ Starting Flask server on http://localhost:5000")
        app.run(host='0.0.0.0', port=5000, debug=False)
        
    except Exception as e:
        print(f"❌ Failed to start: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()