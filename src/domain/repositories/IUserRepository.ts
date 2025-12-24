export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>
  delete(id: string): Promise<void>
}
