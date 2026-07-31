export type ReaderTheme = 'claro' | 'sepia' | 'escuro';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  file_path: string;
  cover_color: string;
  total_pages: number;
  extracted_text: Record<string, string>;
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_page: number;
  position_in_page: number;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  voice_name: string | null;
  font_size: number;
  theme: ReaderTheme;
  word_highlight: boolean;
  updated_at: string;
}

export interface BookWithProgress extends Book {
  progress: ReadingProgress | null;
}
