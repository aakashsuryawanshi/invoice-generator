import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatbotService, ChatMessage } from '../../services/chatbot.service';

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  messages: ChatMessage[] = [];
  messageInput = new FormControl('');
  isChatbotOpen = false;
  showFeatureBanner = true;
  private subscription: Subscription | null = null;
  private readonly BANNER_DISMISSED_KEY = 'chatbot_feature_banner_dismissed';
  
  @ViewChild('chatMessages') private messagesContainer!: ElementRef;
  
  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.subscription = this.chatbotService.messages$.subscribe(messages => {
      this.messages = messages;
    });
    
    // Check if feature banner was previously dismissed
    let bannerDismissed = false;
    try {
      bannerDismissed = localStorage.getItem(this.BANNER_DISMISSED_KEY) === 'true';
    } catch (error) {
      // console.error('Error accessing localStorage:', error);
      // Default to showing the banner if localStorage access fails
      bannerDismissed = false;
    }
    this.showFeatureBanner = !bannerDismissed;
    
    // Add initial greeting message
    if (this.messages.length === 0) {
      this.chatbotService.sendMessage('Hi there! I\'m your new AI assistant. How can I help with your invoice today?');
    }
  }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }
  
  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
  
  toggleChatbot(): void {
    this.isChatbotOpen = !this.isChatbotOpen;
    if (this.isChatbotOpen) {
      setTimeout(() => {
        this.scrollToBottom();
      }, 100);
    }
  }
  
  sendMessage(): void {
    const message = this.messageInput.value;
    if (message && message.trim()) {
      this.chatbotService.sendMessage(message);
      this.messageInput.setValue('');
    }
  }
  
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
  
  dismissFeatureBanner(): void {
    this.showFeatureBanner = false;
    try {
      localStorage.setItem(this.BANNER_DISMISSED_KEY, 'true');
    } catch (error) {
      console.error('Error saving banner state to localStorage:', error);
      // Continue anyway as the banner is already visually dismissed
    }
  }
  
  provideFeedback(): void {
    // In a real application, this would open a feedback form or dialog
    window.alert('Thank you for wanting to provide feedback! This feature will be available soon.');
  }
  
  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
