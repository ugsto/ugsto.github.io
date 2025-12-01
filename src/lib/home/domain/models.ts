export type SocialLink = {
  readonly platform: string;
  readonly handle: string;
  readonly url: string;
  readonly svgPath: string;
  readonly styles: {
    readonly containerHoverBorder: string;
    readonly iconHoverColor: string;
    readonly ringColor: string;
  }
}
