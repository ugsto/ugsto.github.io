export type WorkshopCommand = {
  cmd: string;
  desc: string;
};

export type WorkshopMetadata = {
  part: number;
  section: number;
  title: string;
  readTimeMinutes: number;
  handsOnMinutes: number;
  commands: WorkshopCommand[];
  nextSlug: string | null;
  prevSlug: string | null;
};

export type WorkshopPage = WorkshopMetadata & {
  slug: string;
  rawMd: string;
  slidesMd: string;
  content: string;
};
