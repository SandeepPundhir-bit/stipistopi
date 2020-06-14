using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using RestApi.Controllers;
using ServiceInterfaces.Dto;

namespace CliClient
{
    public class RestClient
    {
        public SsUser User { get; }
        public string BaseUri { get; }
        public Action<string> WriteLine { get; }
        public RestClient(string baseUri, string userName, string password, bool ignoreServerCertificate = false, Action<string> writeLine = null)
        {
            BaseUri = baseUri;
            User = new SsUser(userName, password);
            WriteLine = writeLine ?? Console.WriteLine;

            if (ignoreServerCertificate)
            {
                var handler = new HttpClientHandler();
                handler.ServerCertificateCustomValidationCallback = (request, cert, chain, errors) => true;
                httpClient = new HttpClient(handler);
            }
            else
            {
                httpClient = new HttpClient();
            }
        }

        public async Task AddUser(string userName, string password, UserRole role)
        {
            var requestUri = $"{BaseUri}/stipistopi/register";
            var requestParam = new NewUserParameter
            {
                Creator = User,
                User = new SsUser(userName, password, role)
            };
            WriteLine("Dispatching request...");
            var content = new StringContent(JsonSerializer.Serialize(requestParam), Encoding.UTF8, "application/json");
            var result = await httpClient.PostAsync(requestUri, content);
            WriteLine($"Server responded with {result.StatusCode}");
        }

        public async Task<IEnumerable<ResourceInfo>> GetResources()
        {
            var requestUri = $"{BaseUri}/stipistopi/resources";
            var stream = await httpClient.GetStreamAsync(requestUri);
            JsonSerializerOptions opts = new JsonSerializerOptions();
            opts.PropertyNameCaseInsensitive = true;
            var resources = await JsonSerializer.DeserializeAsync<IEnumerable<ResourceInfo>>(stream, opts);
            return resources;
        }

        public async Task<IEnumerable<SsUser>> GetUsers()
        {
            var requestUri = $"{BaseUri}/stipistopi/users";
            var requestParam = User;
            var content = new StringContent(JsonSerializer.Serialize(requestParam), Encoding.UTF8, "application/json");
            var result = await httpClient.PostAsync(requestUri, content);
            Console.WriteLine(result.StatusCode);
            var stream = await result.Content.ReadAsStreamAsync();
            // TODO: use the same options for all requests
            JsonSerializerOptions opts = new JsonSerializerOptions();
            opts.PropertyNameCaseInsensitive = true;
            opts.Converters.Add(new JsonStringEnumConverter());
            var resources = await JsonSerializer.DeserializeAsync<IEnumerable<SsUser>>(stream, opts);
            return resources;
        }

        private readonly HttpClient httpClient;
    }
}
