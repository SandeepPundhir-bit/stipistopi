using System.Linq;
using ServiceInterfaces.Dto;
using Xunit;

namespace CliClientTests
{
    public class ResourcesTest
    {
        [Fact]
        public async void Initialization()
        {

            var restClient = new TestRestClient().RestClient;
            var resources = await restClient.GetResources();
            Assert.Empty(resources);
        }

        [Fact]
        public async void AddResource()
        {
            var restClient = new TestRestClient().RestClient;
            SsResource resourceToAdd = new SsResource("resource", "192.168.10.2");
            var result = await restClient.AddResource(resourceToAdd);
            Assert.True(result.Success);
            var actual = (await restClient.GetResources()).Single();
            Assert.Equal(resourceToAdd.ShortName, actual.ShortName);
            Assert.Equal(resourceToAdd.Address, actual.Address);
        }
    }
}
