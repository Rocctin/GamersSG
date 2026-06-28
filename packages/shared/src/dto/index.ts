export type {
  RequestMagicLinkDto,
  VerifyMagicLinkDto,
  AuthTokensResponse,
  RefreshTokenDto,
} from "./auth.dto";

export type {
  UserProfileDto,
  GamerProfileDto,
  OrganiserProfileDto,
  UpdateGamerProfileDto,
  CreateOrganiserProfileDto,
  UpdateOrganiserProfileDto,
} from "./user.dto";

export type { ReviewOrganiserDto, UpdateUserStatusDto } from "./admin.dto";

export type {
  GameDto,
  CreateGameDto,
  UpdateGameDto,
  GameWithRoleDto,
} from "./game.dto";

export type {
  TournamentDto,
  CreateTournamentDto,
  UpdateTournamentDto,
  TournamentRegistrationDto,
  CreateTournamentRegistrationDto,
  TournamentFilterDto,
} from "./tournament.dto";

export type {
  EventDto,
  CreateEventDto,
  UpdateEventDto,
  EventRegistrationDto,
  CreateEventRegistrationDto,
  EventFilterDto,
} from "./event.dto";
