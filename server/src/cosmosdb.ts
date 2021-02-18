import { CosmosClient } from '@azure/cosmos'

// TODO: Partition key issues

import { RoomNote } from './roomNote'
import { DEFAULT_SERVER_SETTINGS } from './types'
import { User } from './user'

const partitionKey = 'https://roguelikecelebration-mud.azurewebsites.net'

const client = new CosmosClient({
  endpoint: process.env.COSMOSDB_ENDPOINT,
  key: process.env.COSMOSDB_KEY
})
const databaseId = 'azure-mud'

const getContainer = (containerId: string) => {
  const database = client.database(databaseId)
  const container = database.container(containerId)
  return container
}

// TODO: All times we fetch all users, filter out banned

const CosmosDB = {
  // TODO: I think I'm only using this for the equivalent of minimalProfileMap. I could just make a minimalProfileMap fn?
  async getAllUsers (): Promise<User[]> {
    const container = await getContainer('users')
    const { resources: users } = await container.items.readAll().fetchAll()
    return (users as unknown as User[])
  },

  async getActiveUsers (): Promise<User[]> {
    const container = getContainer('users')
    const q = 'select * from c where c.isActive = true'
    const { resources: users } = await container.items.query(q, { partitionKey }).fetchAll()
    return users
  },

  async getUserIdForUsername (username: string, requireOnline: boolean = false) {
    const container = getContainer('users')

    const query = {
      query: 'select c.id from c where c.username = @username',
      parameters: [{
        name: '@username',
        value: username
      }]
    }

    if (requireOnline) {
      query.query = 'select c.id from c where c.username = @username and c.isActive = true'
    }

    const result = (await container.items
      .query(query, { partitionKey })
      .fetchNext()).resources[0]
    if (result) { return result.id }
  },

  async setUserAsActive (user: User, isActive: boolean) {
    const container = getContainer('users')
    console.log('Trying to set user as active?', user.id, isActive)
    try {
      return container.item(user.id, partitionKey).replace({ ...user, isActive })
    } catch (e) {
      console.log('ERROR: Could not set user active state', user.id, e)
    }
  },

  async setUserHeartbeat (user: User) {
    console.log('Setting heartbeat', user.id)
    const container = getContainer('users')
    // TBD: Does it accept date objects?
    try {
      return container.item(user.id, partitionKey).replace({ ...user, heartbeat: new Date().valueOf() })
    } catch (e) {
      console.log('ERROR: Could not update user heartbeat', user.id, e)
    }
  },

  async allRoomOccupants () {
    console.log('Attempting to fetch all roomOccupants')
    try {
      const container = getContainer('users')
      const { resources: users } = await container.items.query('select c.id, c.roomId from c where c.isActive = true', { partitionKey }).fetchAll()

      const result = {}
      users.forEach(u => {
        if (!result[u.roomId]) result[u.roomId] = []
        result[u.roomId].push(u.id)
      })

      return result
    } catch (e) {
      console.log('Error fetching all room occupants', e)
    }

    return []
  },

  async roomOccupants (roomId: string) {
    console.log('Attempting to fetch roomOccupants for roomId', roomId)
    try {
      const container = getContainer('users')
      const query = {
        query: 'select c.id from c where c.roomId = @roomId and c.isActive = true',
        parameters: [{
          name: '@roomId',
          value: roomId
        }]
      }
      const { resources: users } = await container.items.query(query, { partitionKey }).fetchAll()
      return users
    } catch (e) {
      console.log('Error fetching room occupants', roomId, e)
    }

    return []
  },

  async setCurrentRoomForUser (user: User, roomId?: string) {
    const data = { ...user, roomId }
    if (!roomId) { delete data.roomId }

    try {
      const container = getContainer('users')
      return await container.item(user.id, partitionKey).replace(data)
    } catch (e) {
      console.log('ERROR: Could not update user', user.id, roomId, e)
    }
  },

  async updateVideoPresenceForUser (user: User, roomId?: string) {
    const data = { ...user, videoRoomId: roomId }
    if (!roomId) { delete data.videoRoomId }

    try {
      const container = getContainer('users')
      return await container.item(user.id, partitionKey).replace(data)
    } catch (e) {
      console.log('ERROR: Could not update user video presence', user.id, roomId, e)
    }
  },

  // TODO: Should this be shoved into roomOccupants?
  async getVideoPresenceForRoom (roomId: string) {
    const container = await getContainer('users')
    const query = {
      query: 'select c.id from c where c.videoRoomId = @roomId and c.isActive = true',
      parameters: [{
        name: '@videoRoomId',
        value: roomId
      }]
    }
    const { resources: users } = await container.items.query(query, { partitionKey }).fetchAll()
    return users
  },

  async getPublicUser (userId: string) {
    const container = await getContainer('users')
    const result = await container.item(userId, partitionKey).read()
    return result.resource as User
  },

  async setUserProfile (userId: string, data: User) {
    const container = getContainer('users')
    const result = await container.item(userId, partitionKey).replace(data)
    return (result.item as unknown) as User
  },

  async createUserProfile (data: User) {
    const container = getContainer('users')
    const result = await container.items.create(data)
    return (result.item as unknown) as User
  },

  async userJustShouted (user: User) {
    const container = await getContainer('users')
    try {
      const { resource: u } = await container.item(user.id, partitionKey).replace({ ...user, lastShouted: new Date().valueOf() })
      return u
    } catch (e) {
      console.log('ERROR: Could not update user shout timestamp', user.id, e)
    }
  },

  async banUser (user: User, isBanned: boolean) {
    try {
      const container = await getContainer('users')
      const { resource: u } = await container.item(user.id, partitionKey).replace({ ...user, isBanned })
      return u
    } catch (e) {
      console.log('ERROR: Could not update user ban status', user.id, e)
    }
  },

  async setModStatus (user: User, isMod: boolean) {
    try {
      const container = await getContainer('users')
      const { resource: u } = await container.item(user.id, partitionKey).replace({ ...user, isMod })
      return u
    } catch (e) {
      console.log('ERROR: Could not update user mod status', user.id, e)
    }
  },

  async modList () {
    const container = getContainer('users')
    const q = 'select c.id from c where c.isMod = true'
    const { resources: users } = await container.items.query(q, { partitionKey }).fetchAll()
    return users
  },

  async getServerSettings () {
    return DEFAULT_SERVER_SETTINGS
    // const container = getContainer('serverSettings')
    // return await container.item('serverSettings').read().resource
  },

  async setServerSettings (data: any) {
    const container = await getContainer('serverSettings')
    return container.items.upsert(data)
  }

  // async addRoomNote(roomId: string, note: RoomNote) {}

  //   async deleteRoomNote(roomId: string, noteId: string) {}

  //   async likeRoomNote(roomId: string, noteId: string, userId: string) {}
  //   async unlikeRoomNote(roomId: string, noteId: string, userId: string) {}

  //   async getRoomNotes(roomId: string) {}

  //   // -----------------------------------------------------------------
  //   // AVAILABILITY
  //   // -----------------------------------------------------------------
  //   async isSpaceClosed() {}
  //   async setSpaceAvailability(open: boolean) {}

  //   // If you want to notify clients a new build has been deployed,
  //   // you need to include the key that's hardcoded into Redis
  //   async webhookDeployKey() {

  //   }

}

export default CosmosDB
