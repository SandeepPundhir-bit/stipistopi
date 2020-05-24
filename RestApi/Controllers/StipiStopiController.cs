﻿using System;
using System.Collections.Generic;
using System.Linq;
using logic;
using Logic.Repository;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ServiceInterfaces;
using ServiceInterfaces.Dto;

namespace RestApi.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class StipiStopiController : ControllerBase
    {
        private readonly ILogger<StipiStopiController> _logger;
        private readonly StipiStopi stipiStopi;

        public StipiStopiController(ILogger<StipiStopiController> logger, StipiStopi stipiStopi, ISsRepository ssRepository)
        {
            _logger = logger;
            this.stipiStopi = stipiStopi;
            if (stipiStopi.GetResources().Count == 0)
                stipiStopi.Populate();
        }

        [HttpGet("resources")]
        public IEnumerable<ResourceInfo> GetResources()
        {
            return stipiStopi.GetResources().Select(ssr => new ResourceInfo
            {
                ShortName = ssr.ShortName,
                Address = ssr.Address,
                IsAvailable = stipiStopi.IsFree(ssr),
                LockedBy = stipiStopi.GetLockedBy(ssr)?.UserName,
            });
        }

        [HttpPost("register")]
        public SsUser NewUser(UserParameter user)
        {
            // TODO Creator parameter
            _logger.LogInformation($"Registering {user.UserName} with a password of length {user.Password.Length}");
            return stipiStopi.NewUser(user.UserName, user.Password, new SsUser("any", "any"));
        }

        [HttpPost("resource")]
        public SsResource NewResource(ResourceParameter resource)
        {
            // TODO Creator parameter
            _logger.LogInformation($"New resource: {resource.ShortName} @ {resource.Address}");
            return stipiStopi.NewResource(resource.ShortName, resource.Address, new SsUser("any", "any"));
        }

        [HttpPost("lock")]
        public bool LockResource(LockParameter @lock)
        {
            _logger.LogInformation($"Trying to lock {@lock.ResourceName} for {@lock.User.UserName}");
            var resource = stipiStopi.GetResources()
                .SingleOrDefault(r => string.Equals(r.ShortName, @lock.ResourceName, StringComparison.InvariantCultureIgnoreCase));
            _logger.LogInformation($"Identified resource {resource.ShortName} @ {resource.Address}");
            return stipiStopi.LockResource(resource, new SsUser(@lock.User.UserName, @lock.User.Password));
        }

        [HttpPost("release")]
        public bool ReleaseResource(LockParameter @lock)
        {
            _logger.LogInformation($"Trying to release {@lock.ResourceName} for {@lock.User.UserName}");
            var resource = stipiStopi.GetResources()
                .SingleOrDefault(r => string.Equals(r.ShortName, @lock.ResourceName, StringComparison.InvariantCultureIgnoreCase));
            _logger.LogInformation($"Identified resource {resource.ShortName} @ {resource.Address}");
            return stipiStopi.ReleaseResource(resource, new SsUser(@lock.User.UserName, @lock.User.Password));
        }
    }

    public class ResourceParameter
    {
        public string ShortName { get; set; }
        public string Address { get; set; }
    }

    public class UserParameter
    {
        public string UserName { get; set; }
        public string Password { get; set; }
    }

    public class LockParameter
    {
        public UserParameter User { get; set; }
        public string ResourceName { get; set; }
    }

    public class ResourceInfo : ResourceParameter
    {
        public bool IsAvailable { get; set; }
        public string LockedBy { get; set; }
    }
}
