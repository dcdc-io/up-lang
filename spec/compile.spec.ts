import { promises } from 'fs';
import up from "../src/up"

const { rmdir, readdir } = promises;

describe('up compiler', () => {
    describe('examples', () => {
        describe('static site', () => {
            xit('docker: can produce a runable output', async () => {
                // remove test data
                await rmdir("./__TEST__/docker", { recursive: true }).catch(() => { })

                const program = await up.load("../examples/staticsite-docker.up")

                expect(program).toBeDefined()

                program.configure({
                    env: {
                        "DOCKER_OUT_FILE": "./__TEST__/docker/output.tar.gz"
                    }
                })

                // build docker image
                await program.signal("up", {})
                const files = readdir("./__TEST__/docker")

                expect(files).toBe(["output.tar.gz"])
            })
        })
    })
})