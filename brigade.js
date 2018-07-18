const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    var acrServer = project.secrets.acrServer
    var acrName = project.secrets.acrName
    var azServicePrincipal = project.secrets.azServicePrincipal
    var azClientSecret = project.secrets.azClientSecret
    var azTenant = project.secrets.azTenant
    var gitPayload = JSON.parse(brigadeEvent.payload)
    var today = new Date()
    var image = "lachlanevenson/oscon-rating-web"
    var gitSHA = brigadeEvent.revision.commit.substr(0,7)
    var imageTag = "master-" + String(gitSHA)
    var acrImage = image + ":" + imageTag
    var helmReleaseNamespace = "default"

    console.log(`==> gitHub webook with commit ID ${gitSHA}`)

    var acr = new Job("job-runner-acr-builder")
    acr.storage.enabled = false
    acr.image = "microsoft/azure-cli:2.0.41"
    acr.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-arg BUILD_DATE="${String(today)}" --build-arg VCS_REF=${gitSHA} --build-arg IMAGE_TAG_REF=${imageTag} -f ./Dockerfile . -r ${acrName}`
    ]
})

events.on("after", (event, project) => {

})
