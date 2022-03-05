import { expect } from 'chai'
import Entity from '../../src/entity/Entity'
import EntityManager from '../../src/entity/EntityManager'
import ManagerJoin from '../../src/proxy/ManagerJoin'

describe('ManagerJoin', () => {
    interface User extends Entity {
        name: string;
    }

    class UserManager extends EntityManager<User> {
        public add(...users: User[]) { this.updateEntities(...users) }
    }

    const userManager = new UserManager()

    const user1 = { id: "1", name: "user1" }
    const user2 = { id: "2", name: "user2" }
    const user3 = { id: "3", name: "user3" }
    const user4 = { id: "4", name: "user4" }

    userManager.add(user1, user2, user3, user4)


    class FriendJoin extends ManagerJoin<{}, { user: User, friend: User }> {
        
        public add(...entries: { user: string, friend: string }[]) {
            // adding symetry cases
            entries = [...entries, ...entries.map(e => ({ user: e.friend, friend: e.user }))]
            // updating model
            this.update(...entries.map(e => ({ key: e, payload: {} })))
        }

    }
    const friendJoin = new FriendJoin({
        user: userManager,
        friend: userManager
    })

    friendJoin.add({ user: '1', friend: '2' })
    friendJoin.add({ user: '1', friend: '3' })
    friendJoin.add({ user: '1', friend: '4' })
    friendJoin.add({ user: '3', friend: '4' })
})