using McMaster.Extensions.CommandLineUtils;

namespace CliClient
{
    [Command(
        Name = "CliClient",
        Description = "StipiStopi command line interface"),
        Subcommand(
            typeof(ResourcesCommand),
            typeof(AddUserCommand),
            typeof(UsersCommand)
            )]
    public class RootCommand
    {
        public RootCommand(IConsole console)
        {
            Console = console;
        }

#pragma warning disable RCS1213, IDE0051 // Used by CLI parser
        private int OnExecute(CommandLineApplication app)
#pragma warning restore
        {
            app.ShowHint();
            return 0;
        }

        public RestClient CreateRestClient()
        {
            var client = new RestClient(
                BaseUrl ?? "https://localhost:8140",
                UserName ?? "test",
                Password ?? "test",
                IgnoreServerCertificate,
                s => Console.WriteLine(s));
            return client;
        }

        [Option]
        public string UserName { get; }

        [Option]
        public string Password { get; }

        [Option]
        public string BaseUrl { get; }

        [Option]
        public bool IgnoreServerCertificate { get; }

        private IConsole Console { get; set; }
    }
}