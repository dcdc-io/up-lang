import { promises } from 'fs';
import up from "../src/up"

const { rmdir, readdir } = promises;

describe('up compiler', () => {
    describe('examples', () => {
        describe('static site', () => {
            it('docker: can produce a runable output', async () => {
                // remove test data
                await rmdir("./__TEST__/docker", { recursive: true }).catch(() => { })

                const stack = await up.loadFile("../examples/staticsite-docker.up")

                expect(stack).toBeDefined()

                stack.configure({
                    env: {
                        "DOCKER_OUT_FILE": "./__TEST__/docker/output.tar.gz"
                    }
                })

                // build docker image
                await stack.signal("up", {})
                const files = readdir("./__TEST__/docker")

                expect(files).toBe(["output.tar.gz"])
            })
        })
    })
})