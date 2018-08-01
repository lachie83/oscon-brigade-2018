const { events, Job, Group } = require('brigadier')

events.on("push", (brigadeEvent, project) => {
    //variables
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

    console.log("started")

    var acr = new Job("job-runner-acr-builder")
    acr.storage.enabled = false
    acr.image = "microsoft/azure-cli:2.0.43"
    acr.tasks = [
        `cd /src/app/web`,
        `az login --service-principal -u ${azServicePrincipal} -p ${azClientSecret} --tenant ${azTenant}`,
        `az acr build -t ${acrImage} --build-arg BUILD_DATE="${String(today)}" --build-arg VCS_REF=${gitSHA} --build-arg IMAGE_TAG_REF=${imageTag} -f ./Dockerfile . -r ${acrName}`
    ]

    var helm = new Job("job-runner-helm")
    helm.storage.enabled = false
    helm.image = "lachlanevenson/k8s-helm:v2.9.1"
    helm.tasks = [
        `helm upgrade --install --reuse-values oscon ./src/app/web/charts/oscon-rating-web --set image=${acrServer}/${image} --set imageTag=${imageTag} --namespace ${helmReleaseNamespace}`
    ]

    var pipeline = new Group()
    var slack = new Job("slack-notify", "technosophos/slack-notify:latest", ["/slack-notify"])

    pipeline.add(acr)
    pipeline.add(helm)
    pipeline.runEach().then( result => {
        slack.storage.enabled = false
        slack.env = {
          SLACK_WEBHOOK: project.secrets.SLACK_WEBHOOK,
          SLACK_USERNAME: "BrigadeBot",
          SLACK_TITLE: ":helm: upgraded oscon",
          SLACK_MESSAGE: result[1].toString(),
          SLACK_COLOR: "#0000ff"
        }
        return slack.run()
      })
    


})

events.on("after", (event, project) => {

})
