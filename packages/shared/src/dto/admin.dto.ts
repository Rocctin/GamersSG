export interface ReviewOrganiserDto {
  action: "APPROVE" | "REJECT";
  rejectionReason?: string; // required if REJECT
}

export interface UpdateUserStatusDto {
  status: "SUSPENDED" | "APPROVED";
  reason?: string;
}
