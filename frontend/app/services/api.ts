// API service for communicating with the Go backend
const API_BASE_URL = 'http://localhost:8080'; // Adjust this to match your backend port

export interface ExportSettings {
  quality: 'high' | 'medium' | 'low';
  format: 'mp4' | 'webm' | 'avi';
  resolution: '1920x1080' | '1280x720' | '854x480';
}

export interface ProjectData {
  mediaItems: any[];
  duration: number;
  aspectRatio: string;
}

export interface UploadedFile {
  filename: string;
  url: string;
  size: number;
  type: string;
}

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private getUploadHeaders(): HeadersInit {
    const token = this.getAuthToken();
    return {
      // No auth headers needed for now
      // ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  async uploadFiles(files: FileList): Promise<UploadedFile[]> {
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: this.getUploadHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result.files;
  }

  async exportVideo(projectData: ProjectData, settings: ExportSettings): Promise<{ jobId: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // No auth needed for now
      body: JSON.stringify({
        projectData,
        settings,
      }),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    const result = await response.json();
    return {
      jobId: result.job_id,
      message: result.message,
    };
  }

  async login(email: string, password: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }

    const result = await response.json();
    const token = result.token;
    localStorage.setItem('authToken', token);
    return token;
  }

  async register(email: string, password: string, name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }
  }

  // WebSocket connection for real-time updates
  connectWebSocket(onMessage: (message: string) => void): WebSocket | null {
    // No auth required for now
    const ws = new WebSocket(`ws://localhost:8080/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      onMessage(event.data);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }

  logout(): void {
    localStorage.removeItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const apiService = new ApiService();