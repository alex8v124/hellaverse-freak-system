export type CharacterClass = 'Angel' | 'Demon' | 'Human' | 'Other';
export type CharacterStatus = 'Libre' | 'Ocupado' | 'Reservado';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserRole = 'Admin' | 'Moderator' | 'User';

export interface Character {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  class?: CharacterClass;
  rank?: string;
  status: CharacterStatus;
  ownerId?: string;
  ownerName?: string;
}

export interface RoleRequest {
  id: string;
  characterId: string;
  characterName: string;
  applicantName: string;
  applicantClass: CharacterClass;
  applicantRank: string;
  roleTest: string;
  status: RequestStatus;
  createdAt: any; // Firestore server timestamp
  userId?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  role: UserRole;
}
