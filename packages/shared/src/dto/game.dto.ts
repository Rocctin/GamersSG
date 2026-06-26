export interface GameDto {
  id: string;
  name: string;
  slug: string;
  coverImage?: string;
  category?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateGameDto {
  name: string;
  slug?: string; // auto-generated from name if omitted
  coverImage?: string;
  category?: string;
}

export interface UpdateGameDto {
  name?: string;
  slug?: string;
  coverImage?: string;
  category?: string;
  isActive?: boolean;
}

export interface GameWithRoleDto extends GameDto {
  inGameRole?: string; // set on the junction table per-user
}
