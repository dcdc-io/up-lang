import { rmdir } from "fs"

describe('up compiler', () => {
    describe('examples', () => {
        describe('static site', () => {
            it('docker: can produce a runable output', async () => {
                // remove test data
                await rmdir("./__TEST__/docker", { recursive: true }, null)

                // build docker image
                
            })
        })
    })
})