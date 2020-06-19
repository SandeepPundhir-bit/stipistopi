using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using RestApi;
using RestApi.Controllers;
using ServiceInterfaces.Dto;

#pragma warning disable RCS1090
namespace CliClient
{
    public class RestClient
    {
        public IRestHttpClient RestHttpClient { get; }
        public string BaseUri { get; }
        public SsUser User { get; }

        private HttpClient HttpClient => RestHttpClient.HttpClient;

        private readonly JsonSerializerOptions JsonOptions;

        public RestClient(IRestHttpClient restHttpClient, string userName, string password)
        {
            RestHttpClient = restHttpClient;
            User = new SsUser(userName, password);
            JsonOptions = CreateJsonOptions();
        }

        public async Task<RestClientResult<SsUser>> AddUser(string userName, string password, UserRole role)
        {
            var request = new RestClientCommand<NewUserParameter, SsUser>(
                "/stipistopi/register",
                new NewUserParameter
                {
                    Creator = User,
                    User = new SsUser(userName, password, role)
                }
            );
            return await GenericRequest(request);
        }

        public async Task<RestClientResult<SsResource>> AddResource(SsResource resource)
        {
            var request = new RestClientCommand<NewResourceParameter, SsResource>(
                "/stipistopi/resource",
                new NewResourceParameter
                {
                    Creator = User,
                    Resource = resource
                }
            );
            return await GenericRequest(request);
        }

        public async Task<RestClientResult<bool>> DelResource(string shortName)
        {
            var request = new RestClientCommand<NewResourceParameter, bool>(
                "/stipistopi/resource/delete",
                new NewResourceParameter
                {
                    Creator = User,
                    Resource = new SsResource { ShortName = shortName }
                }
            );
            return await GenericRequest(request);
        }

        public async Task<RestClientResult<bool>> UpdateResourceDescription(
            string resourceName, string oldDescription, string newDescription)
        {
            var request = new RestClientCommand<SetResourceDescriptionParameter, bool>(
                "/stipistopi/resource/description",
                new SetResourceDescriptionParameter
                {
                    ResourceName = resourceName,
                    OldDescription = oldDescription,
                    NewDescription = newDescription,
                    User = User,
                }
            );
            return await GenericRequest(request);
        }

        public async Task<IEnumerable<ResourceInfo>> GetResources()
        {
            var requestUri = GetUri("/stipistopi/resources");
            var stream = await HttpClient.GetStreamAsync(requestUri);
            return await JsonSerializer.DeserializeAsync<IEnumerable<ResourceInfo>>(stream, JsonOptions);
        }

        public async Task<RestClientResult<IEnumerable<SsUser>>> GetUsers()
        {
            return await GenericRequest<SsUser, IEnumerable<SsUser>>(
                new RestClientCommand<SsUser, IEnumerable<SsUser>>(
                    "/stipistopi/users",
                    User));
        }

        public async Task<RestClientResult<TResponse>> GenericRequest<TRequest, TResponse>(RestClientCommand<TRequest, TResponse> restClientCommand)
        {
            var requestUri = GetUri(restClientCommand.Uri);
            var content = new StringContent(JsonSerializer.Serialize(restClientCommand.RequestParam), Encoding.UTF8, "application/json");
            var response = await HttpClient.PostAsync(requestUri, content);
            if (response.StatusCode != HttpStatusCode.OK)
            {
                var stream = await response.Content.ReadAsStreamAsync();
                try
                {
                    var error = await JsonSerializer.DeserializeAsync<RestError>(stream, JsonOptions);
                    return new RestClientResult<TResponse>(error);
                }
                catch (JsonException)
                {
                    return new RestClientResult<TResponse>(new RestError
                    {
                        Message = $"There has been an unexpected error. Status code: {response.StatusCode}"
                    });
                }
            }
            {
                var stream = await response.Content.ReadAsStreamAsync();
                var result = await JsonSerializer.DeserializeAsync<TResponse>(stream, JsonOptions);
                return new RestClientResult<TResponse>(result);
            }
        }

        private static JsonSerializerOptions CreateJsonOptions()
        {
            var opts = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            opts.Converters.Add(new JsonStringEnumConverter());
            return opts;
        }

        private string GetUri(string withoutBase)
        {
            return RestHttpClient.BaseUri + withoutBase;
        }
    }
}
#pragma warning restore