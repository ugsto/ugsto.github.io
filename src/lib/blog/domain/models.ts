import * as m from "$lib/paraglide/messages";

export class ReadTime {
  constructor(private readTimeSeconds: number) { }
  toString(): string {
    const hours = Math.floor(this.readTimeSeconds / 3600);
    const minutes = Math.floor((this.readTimeSeconds % 3600) / 60);
    const seconds = this.readTimeSeconds % 60;

    const message = [
      hours > 0 ?
        hours === 1 ?
          m.read_time_hours_singular()
          : m.read_time_hours_plural({ hours })
        : null,
      minutes > 0 ?
        minutes === 1 ?
          m.read_time_minutes_singular()
          : m.read_time_minutes_plural({ minutes })
        : null,
      seconds > 0 ?
        seconds === 1 ?
          m.read_time_seconds_singular()
          : m.read_time_seconds_plural({ seconds })
        : null
    ].filter(Boolean).join(', ');

    return message;
  }
}

export type PostMetadata = {
  date: string;
  readTimeSeconds: number;
  thumbnail: string;
  isFeatured: boolean;
  locales: Record<string, {
    title: string;
    excerpt: string;
    categories: string[];
  }>;
}

export type BlogPost = {
  title: string;
  excerpt: string;
  date: Date;
  categories: string[];
  readTime: ReadTime;
  thumbnail: string;
  isFeatured: boolean;
  slug: string;
  content: string;
}

export type BlogPostSummary = {
  title: string;
  excerpt: string;
  date: Date;
  categories: string[];
  readTime: ReadTime;
  thumbnail: string;
  isFeatured: boolean;
  slug: string;
}
